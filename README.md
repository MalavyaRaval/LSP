# LSP-REC

## Published Papers for this project

1. https://ojs.aaai.org/index.php/AAAI-SS/article/view/35555
2. https://link.springer.com/chapter/10.1007/978-3-032-05607-8_12

## Project Setup

### Backend Setup

```bash
cd backend
npm install dotenv
npm install multer
npm audit fix
```

### Run Backend

```bash
cd backend
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
npm audit fix
```

### Start Frontend

```bash
cd frontend
npm run dev
```

## Analytics & Monitoring

### Start Analytics Stack (Prometheus + Grafana)

Run this command to start monitoring your application:

```powershell
.\manage-dashboards.ps1 -Action start
```

Then open **http://localhost:3000** in your browser.

### Login
UserName: admin   
Password: admin

View three auto-provisioned dashboards:

- Performance Dashboard - Request latency, throughput, status codes, CPU/memory
- System Metrics Dashboard - Memory, CPU, GC, event loop lag
- Analytics Dashboard - Request distribution and latency analysis

### Stop Analytics Stack

```powershell
.\manage-dashboards.ps1 -Action stop
```

### Additional Commands

```powershell
# Check stack status
.\manage-dashboards.ps1 -Action status

# Backup dashboards
.\manage-dashboards.ps1 -Action backup
```

### View Metrics

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
