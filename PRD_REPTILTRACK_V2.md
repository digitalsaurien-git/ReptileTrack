# 🦎 PRD : ReptilTrack V2 (Mise à Jour Finale)

## 1. Vision du Produit
**ReptilTrack** est une application web de gestion de collection de reptiles conçue pour les éleveurs amateurs et professionnels exigeants. Elle combine un suivi biologique précis, une gestion administrative conforme aux réglementations (CITES/DDPP) et une analyse financière complète du cheptel et des infrastructures, le tout dans une interface haut de gamme inspirée de l'esthétique "Biophilic Curator".

## 2. Objectifs Stratégiques
- **Simplifier la gestion quotidienne** : Centraliser les soins, les mues et les repas.
- **Assurer la conformité réglementaire** : Faciliter les contrôles DDPP avec des fiches d'identité imprimables aux normes.
- **Optimiser les coûts** : Calculer précisément la consommation électrique et la répartition des investissements financiers.
- **Offrir une expérience premium** : Proposer une UI responsive "Glassmorphism" moderne et fluide.

## 3. Fonctionnalités Détaillées

### 3.1 Gestion de Collection (Specimen Tracking)
- **Fiches Animalières Complètes** : Nom scientifique (Vérifié via une base taxonomique intégrée), Nom vernaculaire, Sexe (♂/♀), Date de naissance, Origine.
- **Suivi de Santé & Croissance** : Courbe de poids, historique des repas, rythme des mues.
- **Onglet Administratif & CITES** :
  - Saisie des numéros de CITES et de marquage (Puce/Transpondeur).
  - Codes Source officiels (W, C, F, R).
  - Gestion documentaire simulée (archivage des références de cession, attestations de marquage).
  - Bouton **"Imprimer la Fiche"** : Génère une fiche d'identité officielle formatée pour l'impression A4.

### 3.2 Gestion des Habitats (Habitat Monitoring)
- **Parc Infrastructure** : Liste détaillée des terrariums/racks avec dimensions et population.
- **Logistique Équipement** : Assignation de matériel technique spécifique par habitat.
- **Suivi Financier de l'Habitat** : Saisie du prix d'achat de la structure et du prix de revente estimé.

### 3.3 Gestion du Matériel & Équipements
- **Inventaire Technique** : Gestion par types (Lampes [UVB], Tapis chauffants, Brumisation).
- **Identification Unitaire** : Suivi par numéro de série/ID unique pour les stocks.
- **Système de Marques** : Datalist intelligente incluant les leaders du marché (Exo Terra, HabiStat, etc.).
- **Duplication en Masse** : Possibilité d'ajouter des lots de matériel (ex: 10 ampoules identiques) en une seule action.

### 3.4 Calculateur d'Énergie & Coûts Électriques
- **Analyse de Consommation** : Calcul du coût quotidien, mensuel et annuel basé sur le tarif local du kWh.
- **Répartition par Habitat** : Visualisation de l'empreinte énergétique de chaque terrarium.

### 3.5 Module de Finance Global (Bilan)
- **Page "Bilan" Dédiée** : Centralisation complète des finances.
- **Indicateurs de Performance** :
  - **Valeur Totale du Cheptel** (Revente estimée).
  - **Dépenses Globales** (Achats matériels + structures + animaux).
  - **Plus-value Potentielle** : Différence entre Valeur de revente et Coût d'achat.
  - **Répartition des Investissements** : Graphiques/Tableaux de breakdown par catégorie.

## 4. Design & Expérience Utilisateur (The Biophilic Curator)
- **Thème "Navy-Emerald"** : Fond bleu nuit profond (`#0f141a`), accents Vert Émeraude (`#4edea3`).
- **Glassmorphism** : Cartes avec flou d'arrière-plan, bordures semi-transparentes blanches.
- **Responsive Design** : Optimisation pour mobiles (saisie sur le terrain) et tablettes/desktop (analyse et impression).
- **Accessibilité** : Respect des contrastes et navigation clavier via ARIA labels.

## 5. Stack Technique
- **Frontend** : React 18+ (avec Vite.js).
- **Gestion d'État** : Context API & Hooks personnalisés.
- **Icônes** : Lucide React.
- **Stockage** : LocalStorage (Assurant la persistance des données sans backend).
- **Styling** : Vanilla CSS 3 (Modern CSS variables & Grid/Flex).

---
*Document produit le 29/03/2026 - Version Finale consolidée.*
