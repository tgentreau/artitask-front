# ArtiTask Frontend

Interface web de gestion d'interventions pour artisans

## 🚀 Stack Technique

- **Framework**: Angular 17
- **Architecture**: Standalone Components + Signals
- **Styling**: Tailwind CSS
- **State Management**: Angular Signals
- **HTTP Client**: Angular HttpClient avec intercepteurs
- **Routing**: Angular Router avec lazy loading
- **Formulaires**: Reactive Forms
- **Documentation**: Compodoc

## 📋 Prérequis

- Node.js v18.x ou supérieur
- NPM v9.x ou supérieur
- Angular CLI v17.x

## 🔧 Installation

### 1. Cloner le repository

```bash
git clone https://gitlab.com/tgentreau/artitask-front.git
cd artitask-front
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration de l'environnement

Éditer le fichier `src/environments/environment.ts` :

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  appName: 'ArtiTask',
  appVersion: '1.0.0'
};
```

Pour la production, éditer `src/environments/environment.prod.ts` :

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.artitask.fr',
  appName: 'ArtiTask',
  appVersion: '1.0.0'
};
```

## 🚀 Démarrage

### Développement

```bash
ng serve
```

L'application sera accessible sur `http://localhost:4200`

### Build de production

```bash
ng build --configuration production
```

Les fichiers de production seront dans le dossier `dist/`

### Avec Docker

```bash
docker build -t artitask-frontend .
docker run -p 80:80 artitask-frontend
```

## 📁 Architecture du Projet

```
src/
├── app/
│   ├── core/                      # Services singleton et configuration
│   │   ├── auth/                 # Authentification
│   │   │   ├── services/         # AuthService
│   │   │   ├── guards/           # AuthGuard
│   │   │   ├── interceptors/     # JWT Interceptor
│   │   │   ├── models/           # Interfaces
│   │   │   └── components/       # Login, Register
│   │   │
│   │   ├── layout/              # Layout principal
│   │   │   ├── header/
│   │   │   ├── sidebar/
│   │   │   └── footer/
│   │   │
│   │   └── services/            # Services globaux
│   │       ├── api.service.ts
│   │       ├── notification.service.ts
│   │       └── error-handler.service.ts
│   │
│   ├── domain/                   # Modules métier
│   │   ├── dashboard/           # Tableau de bord
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── models/
│   │   │
│   │   ├── intervention/        # Gestion interventions
│   │   │   ├── components/
│   │   │   │   ├── list/
│   │   │   │   ├── detail/
│   │   │   │   ├── create/
│   │   │   │   └── edit/
│   │   │   ├── services/
│   │   │   └── models/
│   │   │
│   │   ├── client/             # Gestion clients
│   │   │   └── [même structure]
│   │   │
│   │   └── service/            # Catalogue services
│   │       └── [même structure]
│   │
│   ├── shared/                 # Éléments réutilisables
│   │   ├── components/        # Composants UI
│   │   │   ├── button/
│   │   │   ├── card/
│   │   │   ├── modal/
│   │   │   ├── table/
│   │   │   └── form/
│   │   ├── directives/        # Directives personnalisées
│   │   ├── pipes/             # Pipes personnalisés
│   │   ├── models/            # Interfaces partagées
│   │   └── utils/             # Fonctions utilitaires
│   │
│   ├── app.component.ts       # Composant racine
│   ├── app.config.ts          # Configuration de l'app
│   └── app.routes.ts          # Configuration du routing
│
├── assets/                     # Images, fonts, etc.
├── environments/              # Configuration par environnement
└── styles.css                 # Styles globaux avec Tailwind
```

## 🎨 Composants Principaux

### Authentification

- **LoginComponent** : Formulaire de connexion
- **RegisterComponent** : Inscription nouvel artisan
- **ProfileComponent** : Gestion du profil utilisateur

### Dashboard

- **DashboardComponent** : Vue d'ensemble avec statistiques
- **StatsCardComponent** : Cartes de statistiques
- **InterventionChartComponent** : Graphiques d'interventions

### Interventions

- **InterventionListComponent** : Liste paginée des interventions
- **InterventionDetailComponent** : Détails complets d'une intervention
- **InterventionFormComponent** : Création/modification d'intervention
- **InterventionStatusComponent** : Gestion du statut

### Clients

- **ClientListComponent** : Liste avec recherche et filtres
- **ClientDetailComponent** : Fiche client complète
- **ClientFormComponent** : Formulaire client
- **ClientHistoryComponent** : Historique des interventions

### Services

- **ServiceListComponent** : Catalogue des services
- **ServiceFormComponent** : Création/modification de service
- **ServicePricingComponent** : Configuration tarification

## 🧪 Tests

### Tests unitaires

```bash
ng test
```

### Tests E2E

```bash
ng e2e
```

### Tests avec couverture

```bash
ng test --code-coverage
```

## 🔌 Services Angular

### AuthService

```typescript
login(credentials: LoginRequest): Observable<LoginResponse>
logout(): void
refreshToken(): Observable<TokenResponse>
isAuthenticated(): boolean
getCurrentUser(): ArtisanProfile | null
```

### InterventionService

```typescript
getAll(params?: QueryParams): Observable<Intervention[]>
getById(id: string): Observable<Intervention>
create(data: CreateInterventionRequest): Observable<{id: string}>
update(id: string, data: UpdateInterventionRequest): Observable<void>
updateStatus(id: string, status: InterventionStatus): Observable<void>
delete(id: string): Observable<void>
```

### ClientService

```typescript
getAll(params?: QueryParams): Observable<Client[]>
getById(id: string): Observable<Client>
create(data: CreateClientRequest): Observable<{id: string}>
update(id: string, data: UpdateClientRequest): Observable<void>
delete(id: string): Observable<void>
search(query: string): Observable<Client[]>
```

## 🛡️ Guards et Intercepteurs

### AuthGuard

Protège les routes nécessitant une authentification

```typescript
canActivate(): boolean {
  if (this.authService.isAuthenticated()) {
    return true;
  }
  this.router.navigate(['/login']);
  return false;
}
```

### JWT Interceptor

Ajoute automatiquement le token JWT aux requêtes

```typescript
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  const token = this.authService.getToken();
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next.handle(req);
}
```

## 📱 Responsive Design

L'application est entièrement responsive avec Tailwind CSS :

- **Mobile** : Navigation bottom bar, vues simplifiées
- **Tablette** : Sidebar collapsible, grilles adaptatives
- **Desktop** : Interface complète avec sidebar fixe

## 🎯 Routing

```typescript
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./core/auth/components/login/login.component')
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { 
        path: 'dashboard',
        loadComponent: () => import('./domain/dashboard/dashboard.component')
      },
      {
        path: 'interventions',
        loadChildren: () => import('./domain/intervention/intervention.routes')
      },
      {
        path: 'clients',
        loadChildren: () => import('./domain/client/client.routes')
      },
      {
        path: 'services',
        loadChildren: () => import('./domain/service/service.routes')
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
```

## 📦 Scripts NPM

| Script | Description |
|--------|-------------|
| `ng serve` | Démarre le serveur de développement |
| `ng build` | Build de production |
| `ng test` | Lance les tests unitaires |
| `ng e2e` | Lance les tests E2E |
| `ng lint` | Vérifie le code avec ESLint |
| `ng generate` | Génère des composants/services |

## 🚀 Déploiement

### Build de production

```bash
ng build --configuration production
```

## 🎨 Conventions de Code

### Nommage

- **Composants** : PascalCase avec suffixe `Component`
- **Services** : PascalCase avec suffixe `Service`
- **Interfaces** : PascalCase sans préfixe `I`
- **Méthodes** : camelCase
- **Constantes** : UPPER_SNAKE_CASE

### Structure des composants

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './example.component.html',
  styleUrl: './example.component.css'
})
export class ExampleComponent implements OnInit {
  private readonly service = inject(ExampleService);
  
  ngOnInit(): void {
    // Initialisation
  }
}
```

## 📊 Performance

- **Lazy loading** : Chargement à la demande des modules
- **OnPush strategy** : Optimisation de la détection de changements
- **Signals** : Gestion d'état réactive et performante
- **Tree shaking** : Suppression du code non utilisé
- **Bundle optimization** : Minification et compression

## 👥 Contributeurs

- Équipe ArtiTask

## 📄 Licence

Propriétaire - ArtiTask © 2025
