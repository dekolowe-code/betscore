# Prompt de Développement — Assistant IA de Paris Sportifs

## Vue d'ensemble du projet

Tu vas construire un **assistant IA de paris sportifs** complet.
Le site analyse en temps réel les matchs du jour (50+ par journée),
récupère les cotes disponibles sur les bookmakers de référence,
et génère des recommandations personnalisées selon la cote cible demandée par l'utilisateur
(ex: "donne-moi un coupon à cote 5", "coupon à 10", etc.).

> Ce site ne gère **pas** de vrais paris ni d'argent réel.
> C'est un outil de conseil et d'analyse basé sur l'IA.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Backend API | Python 3.11+ · FastAPI |
| Base de données | Neon (PostgreSQL serverless) |
| ORM | SQLAlchemy + asyncpg |
| IA / ML | OpenAI GPT-4o ou Claude API (analyse textuelle) + modèle statistique maison |
| Tâches async | Celery + Redis |
| Scraping cotes | Playwright ou httpx + BeautifulSoup |
| Frontend | React 18 + Next.js 14 (App Router) |
| Styles | Tailwind CSS |
| Temps réel | WebSocket (FastAPI) ou SSE |
| Auth | JWT + refresh tokens |
| Hébergement backend | Railway ou Render |
| Hébergement frontend | Vercel |

---

## Architecture générale

```
Utilisateur
    │
    ▼
Next.js Frontend
    │  REST API / WebSocket
    ▼
FastAPI Backend (Python)
    ├── Module Scraper        → récupère matchs + cotes (1xBet, Paryaj Pam, etc.)
    ├── Module IA Analyse     → analyse chaque match en profondeur
    ├── Module Coupon Builder → sélectionne les matchs pour atteindre la cote cible
    ├── Module Auth           → gestion utilisateurs
    └── Module Historique     → sauvegarde prédictions + résultats
    │
    ▼
Neon PostgreSQL
    ├── users
    ├── matches
    ├── odds
    ├── predictions
    ├── coupons
    └── results
```

---

## Base de données — Schéma Neon

```sql
-- Utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    plan TEXT DEFAULT 'free',        -- free | pro | vip
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Matchs du jour
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE,          -- ID API source
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    league TEXT NOT NULL,
    country TEXT,
    kickoff_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled',  -- scheduled | live | finished
    home_score INT,
    away_score INT,
    fetched_at TIMESTAMPTZ DEFAULT now()
);

-- Cotes par marché
CREATE TABLE odds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id),
    bookmaker TEXT NOT NULL,          -- 1xbet | paryaj_pam | betway | etc.
    market TEXT NOT NULL,             -- 1X2 | double_chance | btts | over_under | corners | cards | halftime | exact_score | handicap
    selection TEXT NOT NULL,          -- ex: "home" | "draw" | "away" | "over_2.5" | "btts_yes"
    odd_value NUMERIC(6,2) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Prédictions IA par match
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id),
    market TEXT NOT NULL,
    selection TEXT NOT NULL,
    confidence NUMERIC(5,2),          -- 0 à 100
    reasoning TEXT,                   -- explication IA en texte
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Coupons générés
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    target_odd NUMERIC(6,2),          -- cote demandée (5, 10, etc.)
    actual_odd NUMERIC(6,2),          -- cote réelle obtenue
    selections JSONB NOT NULL,        -- [{match_id, market, selection, odd}, ...]
    confidence_avg NUMERIC(5,2),
    bookmaker TEXT,
    status TEXT DEFAULT 'pending',    -- pending | won | lost | partial
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Résultats (pour évaluer la performance IA)
CREATE TABLE results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id),
    coupon_id UUID REFERENCES coupons(id),
    prediction_correct BOOLEAN,
    actual_result TEXT,
    resolved_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Backend Python — Structure des fichiers

```
backend/
├── main.py                    # Point d'entrée FastAPI
├── config.py                  # Variables d'env (Neon URL, API keys)
├── database.py                # Connexion asyncpg + SQLAlchemy async
│
├── routers/
│   ├── auth.py                # POST /register, /login, /refresh
│   ├── matches.py             # GET /matches/today, /matches/{id}
│   ├── odds.py                # GET /odds/{match_id}
│   ├── analysis.py            # POST /analysis/match, /analysis/coupon
│   └── coupons.py             # GET /coupons/history, POST /coupons/generate
│
├── services/
│   ├── scraper.py             # Récupération matchs + cotes bookmakers
│   ├── ai_engine.py           # Analyse IA (appel LLM + stats)
│   ├── coupon_builder.py      # Algorithme de construction de coupon
│   └── result_tracker.py     # Mise à jour résultats + scoring IA
│
├── models/
│   ├── user.py
│   ├── match.py
│   ├── odds.py
│   ├── prediction.py
│   └── coupon.py
│
├── tasks/
│   ├── fetch_matches.py       # Celery task : toutes les heures
│   ├── fetch_odds.py          # Celery task : toutes les 15 min
│   └── update_results.py     # Celery task : après chaque match
│
└── utils/
    ├── jwt.py
    ├── odds_calculator.py     # Calcul cote combinée, marge, valeur
    └── stats.py               # Helpers statistiques
```

---

## Module Scraper — Logique de récupération

```python
# services/scraper.py

import httpx
from bs4 import BeautifulSoup
from typing import List, Dict

# Sources à scraper / appeler
SOURCES = {
    "api_football": {
        "type": "api",
        "base_url": "https://v3.football.api-sports.io",
        "key_header": "x-apisports-key"
    },
    "the_odds_api": {
        "type": "api",
        "base_url": "https://api.the-odds-api.com/v4",
        # Fournit les cotes agrégées de 1xBet, Betway, etc.
    }
}

async def fetch_todays_matches() -> List[Dict]:
    """
    Récupère tous les matchs du jour depuis l'API Football.
    Retourne: liste de dicts avec id, équipes, ligue, heure, statut.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SOURCES['api_football']['base_url']}/fixtures",
            params={"date": "2025-05-20"},
            headers={"x-apisports-key": API_FOOTBALL_KEY}
        )
        data = response.json()
        return parse_fixtures(data["response"])

async def fetch_odds_for_match(match_external_id: str) -> List[Dict]:
    """
    Récupère toutes les cotes disponibles pour un match:
    - 1X2, Double chance, BTTS, Over/Under (1.5 / 2.5 / 3.5)
    - Corners (over/under 8.5, 9.5...), Cartons, Mi-temps, Score exact
    Retourne: [{bookmaker, market, selection, odd_value}]
    """
    pass

async def scrape_paryaj_pam(match_slug: str) -> List[Dict]:
    """
    Scraping direct Paryaj Pam si pas d'API disponible.
    Utilise Playwright pour les pages JS-heavy.
    """
    pass
```

---

## Module IA — Analyse d'un match

```python
# services/ai_engine.py

ANALYSIS_PROMPT = """
Tu es un expert analyste de paris sportifs. Analyse ce match en profondeur.

Match: {home_team} vs {away_team}
Compétition: {league}
Date: {kickoff_at}

Données disponibles:
- Forme récente domicile (5 derniers matchs): {home_form}
- Forme récente extérieur (5 derniers matchs): {away_form}
- Confrontations directes (H2H): {h2h}
- Classement actuel: {standings}
- Blessés / suspendus: {injuries}
- Cotes bookmakers actuelles: {odds_json}

MARCHÉS À ANALYSER:
1. Résultat final (1X2)
2. Double chance (1X, X2, 12)
3. Les deux équipes marquent (BTTS)
4. Total buts (Over/Under 1.5, 2.5, 3.5)
5. Résultat mi-temps
6. Nombre de corners (Over/Under 8.5, 9.5, 10.5)
7. Nombre de cartons
8. Handicap asiatique

Pour CHAQUE marché, fournis:
- Ta prédiction (la sélection recommandée)
- Un score de confiance de 0 à 100
- Une justification courte (2-3 phrases max)
- Si la cote bookmaker représente une VALUE BET (valeur attendue positive)

Réponds uniquement en JSON structuré.
"""

async def analyze_match(match: dict, odds: list) -> dict:
    """
    Envoie le match à l'IA et retourne les prédictions structurées.
    """
    prompt = ANALYSIS_PROMPT.format(
        home_team=match["home_team"],
        away_team=match["away_team"],
        league=match["league"],
        kickoff_at=match["kickoff_at"],
        home_form=await get_team_form(match["home_team_id"]),
        away_form=await get_team_form(match["away_team_id"]),
        h2h=await get_h2h(match["home_team_id"], match["away_team_id"]),
        standings=await get_standings(match["league_id"]),
        injuries=await get_injuries(match["match_id"]),
        odds_json=odds
    )

    response = await call_llm(prompt)
    return parse_predictions(response)

async def analyze_all_todays_matches() -> list:
    """
    Analyse en masse tous les matchs du jour.
    Utilise asyncio.gather pour paralléliser les appels.
    """
    matches = await fetch_todays_matches()
    tasks = [analyze_match(m, await fetch_odds_for_match(m["id"])) for m in matches]
    results = await asyncio.gather(*tasks)
    return results
```

---

## Module Coupon Builder — Algorithme de construction

```python
# services/coupon_builder.py

from typing import List

def build_coupon(
    predictions: List[dict],
    target_odd: float,
    tolerance: float = 0.5,
    min_confidence: int = 65
) -> dict:
    """
    Sélectionne les meilleurs matchs pour atteindre la cote cible.

    Algorithme:
    1. Filtrer: garder uniquement prédictions avec confiance >= min_confidence
    2. Trier: par score confiance décroissant
    3. Greedy selection: ajouter des sélections jusqu'à atteindre la cote cible
    4. Ajuster: si cote trop haute, retirer la sélection la moins sûre
    5. Valider: vérifier cohérence (pas deux matchs du même groupe à la même heure)

    Args:
        predictions: liste des prédictions IA du jour
        target_odd: cote totale souhaitée (ex: 5.0, 10.0, 20.0)
        tolerance: marge acceptable (±0.5 par défaut)
        min_confidence: seuil minimum de confiance IA (65% par défaut)

    Returns:
        {
          "selections": [...],
          "total_odd": 5.23,
          "confidence_avg": 74,
          "bookmaker": "1xbet",
          "warning": null  # ou message si compromis nécessaire
        }
    """
    candidates = [p for p in predictions if p["confidence"] >= min_confidence]
    candidates.sort(key=lambda x: x["confidence"], reverse=True)

    selected = []
    current_odd = 1.0

    for candidate in candidates:
        if current_odd * candidate["odd_value"] <= target_odd + tolerance:
            selected.append(candidate)
            current_odd *= candidate["odd_value"]

        if abs(current_odd - target_odd) <= tolerance:
            break

    return {
        "selections": selected,
        "total_odd": round(current_odd, 2),
        "confidence_avg": round(sum(s["confidence"] for s in selected) / len(selected), 1),
        "bookmaker": get_best_bookmaker(selected),
        "warning": generate_warning(current_odd, target_odd, tolerance)
    }


def build_multiple_coupons(predictions: list, target_odd: float) -> dict:
    """
    Génère 3 variantes de coupon pour la cote demandée:
    - Prudent: confiance min 75%, cote exacte ±0.3
    - Standard: confiance min 65%, cote exacte ±0.5
    - Risqué: confiance min 55%, cote exacte ±1.0
    """
    return {
        "prudent":  build_coupon(predictions, target_odd, tolerance=0.3, min_confidence=75),
        "standard": build_coupon(predictions, target_odd, tolerance=0.5, min_confidence=65),
        "risque":   build_coupon(predictions, target_odd, tolerance=1.0, min_confidence=55),
    }
```

---

## API Endpoints principaux

```
# AUTH
POST   /api/auth/register          → créer un compte
POST   /api/auth/login             → retourne JWT
POST   /api/auth/refresh           → refresh token

# MATCHS
GET    /api/matches/today          → tous les matchs du jour avec statut IA
GET    /api/matches/{id}           → détail d'un match
GET    /api/matches/{id}/odds      → toutes les cotes disponibles par marché
GET    /api/matches/{id}/analysis  → analyse IA complète du match

# COUPONS
POST   /api/coupons/generate       → body: { target_odd: 5, bookmaker: "any" }
GET    /api/coupons/today          → coupons du jour pré-générés (3 niveaux)
GET    /api/coupons/history        → historique des coupons de l'utilisateur

# RECHERCHE
GET    /api/search?q=PSG           → chercher un match ou une équipe
GET    /api/leagues                → ligues disponibles ce jour

# STATS IA
GET    /api/stats/performance      → taux de réussite IA (30j, 90j, all)
```

---

## Frontend — Pages et composants

```
app/
├── page.tsx                       # Landing page
├── dashboard/
│   ├── page.tsx                   # Dashboard principal
│   ├── matches/page.tsx           # Tous les matchs du jour
│   ├── matches/[id]/page.tsx      # Fiche analyse d'un match
│   └── coupons/page.tsx           # Générateur de coupons
├── auth/
│   ├── login/page.tsx
│   └── register/page.tsx
└── account/
    ├── history/page.tsx           # Historique des coupons
    └── settings/page.tsx

components/
├── MatchCard.tsx                  # Carte match avec prédiction IA
├── CouponBuilder.tsx              # Interface sélection cote cible
├── AnalysisPanel.tsx              # Panneau analyse détaillée d'un match
├── OddsTable.tsx                  # Tableau des cotes par marché + bookmaker
├── ConfidenceBadge.tsx            # Badge niveau de confiance IA
├── MarketSelector.tsx             # Sélecteur de marchés (1X2, BTTS, etc.)
└── AIInsight.tsx                  # Explication IA en langage naturel
```

---

## Interface Coupon Builder — UX Flow

```
1. L'utilisateur arrive sur /dashboard/coupons

2. Il sélectionne la cote cible:
   [ x2 ]  [ x5 ]  [ x10 ]  [ x20 ]  [ x50 ]  [ Personnalisé: _____ ]

3. Il sélectionne le bookmaker (optionnel):
   [ Tous ]  [ 1xBet ]  [ Paryaj Pam ]  [ Betway ]

4. Il sélectionne le niveau de risque:
   [ Prudent 🟢 ]  [ Standard 🟡 ]  [ Risqué 🔴 ]

5. L'IA génère le coupon en temps réel:
   ┌─────────────────────────────────────────────┐
   │  PSG vs Barcelone       Double Chance 1X   1.35  ✓ 84%
   │  Man City vs Arsenal    BTTS Oui           1.72  ✓ 79%
   │  Bayern vs Dortmund     Over 2.5           1.65  ✓ 77%
   │  Juventus vs Inter      Victoire Juventus  1.45  ✓ 71%
   │─────────────────────────────────────────────│
   │  COTE TOTALE: 5.41   Confiance moy: 78%    │
   │  Sur: 1xBet                                 │
   └─────────────────────────────────────────────┘

6. Boutons:
   [ Régénérer ]  [ Voir analyse de chaque match ]  [ Copier le coupon ]
```

---

## Marchés supportés par l'IA

| Code | Marché | Exemple de sélection |
|---|---|---|
| `1x2` | Résultat final | Domicile / Nul / Extérieur |
| `double_chance` | Double chance | 1X / X2 / 12 |
| `btts` | Les deux équipes marquent | Oui / Non |
| `over_under` | Total buts | Over 1.5 / 2.5 / 3.5 |
| `halftime` | Résultat mi-temps | 1 / X / 2 |
| `halftime_fulltime` | Mi-temps / Fin de match | 1/1 · 1/X · X/2... |
| `corners` | Corners total | Over 8.5 / 9.5 / 10.5 |
| `cards` | Cartons | Over 3.5 / 4.5 |
| `exact_score` | Score exact | 1-0 / 1-1 / 2-1... |
| `handicap` | Handicap asiatique | -1 / +1 / -0.5 |
| `anytime_scorer` | Buteur | Joueur X à marquer |

---

## Système de niveaux / Plans utilisateur

| Feature | Gratuit | Pro | VIP |
|---|---|---|---|
| Matchs du jour | 10 par jour | Illimité | Illimité |
| Génération coupons | 2 par jour | Illimité | Illimité |
| Analyse détaillée | Basique | Complète | Complète + IA avancée |
| Marchés disponibles | 1X2 + BTTS | Tous | Tous |
| Alertes value bets | ✗ | ✓ | ✓ |
| Historique performances | 7 jours | 90 jours | Illimité |
| API Access | ✗ | ✗ | ✓ |

---

## Variables d'environnement (.env)

```env
# Base de données
DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.neon.tech/betting_db

# IA
OPENAI_API_KEY=sk-...
# ou
ANTHROPIC_API_KEY=sk-ant-...

# Données sportives
API_FOOTBALL_KEY=xxx
THE_ODDS_API_KEY=xxx

# Auth
JWT_SECRET_KEY=xxx
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Redis (pour Celery)
REDIS_URL=redis://localhost:6379

# App
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,https://monsite.com
```

---

## Tâches planifiées (Celery)

```python
# tasks/fetch_matches.py

from celery import Celery
from celery.schedules import crontab

app = Celery()

app.conf.beat_schedule = {
    # Récupérer les matchs du lendemain à minuit
    "fetch-tomorrows-matches": {
        "task": "tasks.fetch_matches.fetch_and_store",
        "schedule": crontab(hour=0, minute=0),
    },
    # Mettre à jour les cotes toutes les 15 min
    "refresh-odds": {
        "task": "tasks.fetch_odds.refresh_all_odds",
        "schedule": crontab(minute="*/15"),
    },
    # Analyser les nouveaux matchs toutes les heures
    "run-ai-analysis": {
        "task": "tasks.ai_analysis.analyze_pending_matches",
        "schedule": crontab(minute=0),
    },
    # Mettre à jour les résultats après les matchs
    "update-results": {
        "task": "tasks.update_results.check_finished_matches",
        "schedule": crontab(minute="*/30"),
    },
}
```

---

## Démarrage rapide

```bash
# 1. Cloner et installer
git clone https://github.com/ton-repo/betting-ai
cd betting-ai/backend
pip install -r requirements.txt

# 2. Configurer l'environnement
cp .env.example .env
# → Remplir DATABASE_URL (Neon), API keys, JWT secret

# 3. Créer les tables Neon
python -m alembic upgrade head

# 4. Lancer le backend
uvicorn main:app --reload --port 8000

# 5. Lancer Celery (dans un autre terminal)
celery -A tasks worker --loglevel=info
celery -A tasks beat --loglevel=info

# 6. Frontend
cd ../frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## Priorités de développement (ordre recommandé)

1. **Scraper matchs + cotes** — sans données, rien ne fonctionne
2. **Neon DB + modèles** — stocker les matchs et cotes
3. **Moteur IA analyse match** — le cœur du produit
4. **Coupon Builder** — l'algorithme de sélection par cote cible
5. **API FastAPI** — exposer les endpoints
6. **Frontend dashboard** — interface utilisateur
7. **Auth + plans** — monétisation
8. **Tâches planifiées** — automatisation complète
9. **Suivi des résultats** — mesurer la performance IA
10. **Alertes + notifications** — engagement utilisateurs

---

*Généré pour le projet BettingAI — Stack: Python · FastAPI · Neon · Next.js*
