# Attack Surface Management (ASM) Web Console

## What is this App?
This project is an Attack Surface Management (ASM) / External Attack Surface Management (EASM) dashboard. It provides a comprehensive web-based interface to continuously monitor, discover, analyze, and help remediate vulnerabilities and exposed assets that make up an organization's external attack surface. 

It empowers security operations teams by providing visibility into security grades, asset inventories, risk levels, and vulnerability reports through an intuitive dashboard.

### Tech Stack
The frontend is a modern web application built using:
- **[Next.js](https://nextjs.org/)** (React framework with App Router)
- **React 19**
- **Tailwind CSS v4** for utility-first styling
- **[Lucide React](https://lucide.dev/)** for beautiful icons
- **[Recharts](https://recharts.org/)** for data visualization and charts

## Project Structure
The codebase follows a structured architecture, with the main frontend application located locally at:
```text
apps/web-console/
```

## How to Run This Project on Your Computer

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine (version 20.x or higher is recommended).

### Installation & Local Development

1. **Open your terminal and navigate to the project directory**
   If you aren't already in the frontend directory, navigate to it:
   ```bash
   cd apps/web-console
   ```

2. **Install Dependencies**
   Install all the required node modules using standard npm:
   ```bash
   npm install
   ```

3. **Run the Development Server**
   Start the local Next.js development server:
   ```bash
   npm run dev
   ```

4. **View the Application**
   Open your favorite web browser and navigate to [http://localhost:3000](http://localhost:3000) to interact with the web console. The page will hot-reload automatically as you make changes to the code.

## Building for Production

To create an optimized production build of the dashboard, navigate to `apps/web-console` and run:
```bash
npm run build
```

After the build completes, you can start the production server to test it locally:
```bash
npm run start
```
