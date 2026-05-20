# Frontend Aplikace (React & Vite)

Tento adresář (`frontend/react-app`) obsahuje kód pro frontendovou (uživatelské rozhraní) část vašeho informačního systému. Je postavena na moderních webových technologiích, primárně na knihovně React a nástroji Vite. Frontend komunikuje s backendovou částí pomocí REST API.

## Vývojové Prostředí (Docker & Dev Containers)

Stejně jako backend, i frontend je navržen pro běh v Docker kontejneru, což zajišťuje konzistentní prostředí. Konfigurace je součástí hlavního `docker-compose.yml`.

**Způsob vývoje:**
**Dev Containers (VS Code):** Pokud používáte Visual Studio Code s rozšířením "Dev Containers", můžete otevřít projekt přímo uvnitř běžícího *frontendového* kontejneru (nebo sdíleného kontejneru, pokud je tak nastaveno v `.devcontainer`).
    * **Výhody:** Máte k dispozici správnou verzi Node.js, nainstalované `npm` závislosti a nástroje (jako Vite) přímo v terminálu VS Code. Můžete snadno spouštět `npm` skripty, instalovat balíčky atd.
    * **Jak použít:** Podobně jako u backendu, VS Code by vám měl nabídnout "Reopen in Container" nebo můžete použít příkazovou paletu.

## Použité Technologie

* **React:** Populární JavaScriptová knihovna od Facebooku pro vytváření uživatelských rozhraní. Umožňuje stavět UI z malých, znovupoužitelných kousků kódu zvaných komponenty.
* **Vite:** Extrémně rychlý nástroj pro sestavení (build) a vývoj frontendových aplikací. Poskytuje rychlý vývojový server s Hot Module Replacement (HMR), což znamená, že změny v kódu se projeví v prohlížeči téměř okamžitě bez nutnosti obnovení stránky.
* **TypeScript:** Nadstavba JavaScriptu, která přidává statickou typovou kontrolu. Pomáhá předcházet chybám při vývoji a zlepšuje čitelnost a údržbu kódu. Soubory mají příponu `.ts` nebo `.tsx` (pro React komponenty s JSX).
* **Node.js & npm:** Node.js je běhové prostředí pro JavaScript mimo prohlížeč, potřebné pro běh Vite a dalších vývojových nástrojů. `npm` (Node Package Manager) slouží ke správě závislostí projektu (knihoven).
* **CSS:** Standardní jazyk pro stylování webových stránek. V této šabloně můžete používat běžné CSS soubory (např. `App.css`, `index.css`) nebo zvážit použití modernějších přístupů jako CSS Modules nebo CSS-in-JS knihovny, případně utility-first frameworky jako Tailwind CSS.

## Struktura Adresáře `frontend/react-app/`

```
frontend/react-app/
│
├── public/         # Statické soubory, které se kopírují přímo do výstupního adresáře (např. favicon.ico)
│
├── src/            # Hlavní adresář se zdrojovým kódem aplikace
│   ├── assets/     # (Volitelně) Místo pro obrázky, fonty a další statické zdroje importované do kódu
│   ├── components/ # (Doporučeno) Adresář pro znovupoužitelné React komponenty (např. Button, Modal, Card)
│   ├── pages/      # (Doporučeno) Adresář pro komponenty reprezentující celé stránky/pohledy aplikace
│   ├── services/   # (Doporučeno) Moduly pro komunikaci s API (např. funkce pro fetch dat)
│   ├── hooks/      # (Doporučeno) Adresář pro vlastní React Hooks
│   ├── contexts/   # (Doporučeno) Adresář pro React Context API (pokud používáte pro state management)
│   │
│   ├── App.css     # Styly specifické pro hlavní komponentu App
│   ├── App.tsx     # Hlavní React komponenta aplikace, často obsahuje routování
│   ├── index.css   # Globální styly pro celou aplikaci
│   ├── main.tsx    # Vstupní bod aplikace, renderuje komponentu App do HTML
│   └── vite-env.d.ts # Typové definice pro proměnné prostředí Vite
│
├── .eslintrc.cjs   # Konfigurace pro ESLint (nástroj pro kontrolu kvality kódu)
├── index.html      # Hlavní HTML soubor, do kterého Vite vkládá vaši aplikaci
├── package.json    # Definuje metadata projektu, závislosti a npm skripty
├── package-lock.json # Uzamkne verze nainstalovaných závislostí pro konzistentní instalace
├── tsconfig.json   # Hlavní konfigurační soubor pro TypeScript
├── tsconfig.node.json # Specifická konfigurace TS pro Node.js prostředí (např. pro vite.config.ts)
├── vite.config.ts  # Konfigurační soubor pro Vite (např. nastavení proxy pro API)
└── README.md       # Tento soubor (nebo výchozí README z Vite)
```
*(Poznámka: Struktura adresáře `src/` je doporučená, můžete si ji přizpůsobit podle velikosti a komplexnosti projektu.)*

## Klíčové Soubory a Koncepty

* **`index.html`:** Základní HTML stránka. Vite do ní automaticky vloží potřebné JavaScriptové a CSS soubory. Obsahuje `<div id="root"></div>`, kam React renderuje vaši aplikaci.
* **`src/main.tsx`:** Vstupní bod vaší React aplikace. Pomocí `ReactDOM.createRoot().render()` vezme vaši hlavní komponentu (`<App />`) a připojí ji do HTML elementu s `id="root"`.
* **`src/App.tsx`:** Kořenová komponenta vaší aplikace. Obvykle zde nastavujete základní layout, routování (pokud používáte knihovnu jako `react-router-dom`) a renderujete další podkomponenty (stránky).
* **Komponenty (`src/components/`, `src/pages/`):** Základní stavební bloky Reactu. Jsou to funkce nebo třídy, které přijímají vstupní data (props) a vrací JSX (HTML-like syntax) popisující, co se má zobrazit. Snažte se vytvářet malé, znovupoužitelné komponenty.
* **`package.json`:** Definuje projekt.
    * `dependencies`: Knihovny potřebné pro běh aplikace (React, atd.).
    * `devDependencies`: Knihovny potřebné pouze pro vývoj (Vite, TypeScript, ESLint, atd.).
    * `scripts`: Příkazy, které můžete spouštět pomocí `npm run <název_skriptu>` (např. `npm run dev` pro spuštění vývojového serveru, `npm run build` pro vytvoření produkční verze).
* **`vite.config.ts`:** Konfigurace Vite. Důležitá část je nastavení `server.proxy`. To umožňuje přesměrovat požadavky z frontendu (např. na `/api/...`) na běžící backend server (`http://localhost:5000`), čímž se obejdou problémy s CORS (Cross-Origin Resource Sharing) během vývoje.
* **Stylování (`*.css`):** Můžete psát běžné CSS nebo využít pokročilejší techniky. Zvažte použití CSS Modules pro lokální scope stylů nebo framework jako Tailwind CSS pro rychlé stylování pomocí utility tříd.
* **Volání API (`src/services/`):** Pro komunikaci s backendem budete typicky používat vestavěnou funkci `fetch` nebo knihovnu jako `axios` k posílání HTTP požadavků na API endpointy backendu. Je dobré tuto logiku zapouzdřit do samostatných funkcí/modulů. Díky nastavení proxy ve `vite.config.ts` můžete volat relativní cesty (např. `/api/v1/users`) místo plné adresy backendu.

## Jak Pracovat s Frontendem

(Předpokládá se, že kontejnery běží - `docker-compose up -d`)

1.  **Spuštění vývojového serveru:**
    * Frontend kontejner automaticky spouští Vite vývojový server (`npm run dev`).
    * Otevřete prohlížeč na adrese `http://localhost:5173` (nebo portu definovaném v `docker-compose.yml`).
2.  **Vývoj:**
    * Upravujte soubory v adresáři `src/`.
    * Díky Vite HMR by se změny měly okamžitě projevit v prohlížeči.
    * Vytvářejte nové komponenty, stránky, pište logiku pro volání API, styly atd.
3.  **Instalace závislostí:**
    * Pokud potřebujete přidat novou knihovnu (např. `axios` pro API volání nebo `react-router-dom` pro routování):
        ```bash
        npm install <nazev_balicku>
        # Pro vývojové závislosti:
        # npm install <nazev_balicku> --save-dev
        ```
4.  **Volání Backend API:**
    * Použijte `fetch` nebo `axios` k volání relativních cest k vašemu API (např. `/api/v1/users`). Vite proxy se postará o přesměrování na backend.
    * Příklad s `fetch`:
      ```typescript
      fetch('/api/v1/users')
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Chyba při načítání uživatelů:', error));
      ```
5.  **Build pro Produkci (Volitelné):**
    * Pokud byste chtěli vytvořit optimalizovanou verzi frontendu pro nasazení:
        ```bash
        npm run build
        ```
    * Výstup se obvykle nachází v adresáři `dist/`. Pro nasazení byste potřebovali další konfiguraci (např. webový server jako Nginx). V rámci této šablony se typicky používá pouze vývojový server.

## Důležité Poznámky

* **State Management:** Pro komplexnější aplikace budete pravděpodobně potřebovat řešení pro správu stavu (state management), např. React Context API, Zustand, Redux Toolkit.
* **Routování:** Pro navigaci mezi různými stránkami aplikace budete potřebovat routovací knihovnu, nejčastěji `react-router-dom`.
* **Typová Kontrola:** Využívejte výhod TypeScriptu. Definujte typy pro props komponent, stav a data z API.
* **Optimalizace:** Pro reálné aplikace zvažte techniky jako code splitting (Vite to často dělá automaticky), lazy loading komponent a optimalizaci obrázků.

Tento README poskytuje základní přehled frontendové části. Pro hlubší pochopení Reactu, Vite a TypeScriptu doporučujeme prostudovat jejich oficiální dokumentaci.
