🚀 Two-Tier DevOps Project — Expense Tracker with Full Monitoring & CI/CD

A complete production-grade DevOps project that deploys a Two-Tier Application (React + FastAPI) with:

Docker & Docker Compose

Nginx Reverse Proxy

PostgreSQL database

Prometheus + Grafana monitoring stack

cAdvisor + Node Exporter metrics

GitHub Actions CI/CD pipelines

Terraform provisioning of EC2 + Security Groups + Elastic IP

This project demonstrates real-world DevOps skills across automation, containerization, monitoring, IaC, and CI/CD.

🏗 Architecture Overview
                     ┌─────────────────────────┐
                     │        GitHub            │
                     │  (CI/CD Workflows)       │
                     └─────────────┬───────────┘
                                   │
                                   ▼
                       Build & Push Docker Images
                                   │
                     ┌─────────────┴────────────┐
                     │          AWS EC2         │
                     │     (Ubuntu Server)      │
                     └─────────────┬────────────┘
                                   │
        ┌──────────────────────────────────────────────────────┐
        │                 Docker Compose Stack                  │
        │                                                      │
        │  ┌──────────┐       ┌──────────┐       ┌──────────┐ │
        │  │ Frontend │<────→│ Backend  │<────→│ Postgres  │ │
        │  └──────────┘       └──────────┘       └──────────┘ │
        │         │                 │                          │
        │         ▼                 │                          │
        │   ┌────────┐        ┌────────────┐                   │
        │   │ Nginx  │        │ Prometheus │ ← Metrics from    │
        │   └────────┘        └────────────┘   Backend / Infra │
        │         │                 │                          │
        │         ▼                 ▼                          │
        │   Public Access      Grafana Dashboards ← cAdvisor   │
        │                                                      │
        └──────────────────────────────────────────────────────┘


🛠 Tech Stack
DevOps & Automation

Docker, Docker Compose

Nginx Reverse Proxy

Terraform (EC2 + SG + EIP)

GitHub Actions (CI/CD)

Monitoring Stack

Prometheus

Grafana (with Persistent Dashboards)

Node Exporter (system metrics)

cAdvisor (container metrics)

Application

Frontend: React (Node.js build, served by Nginx)

Backend: FastAPI (Python)

Database: PostgreSQL

⭐ Features
🧩 Application

User registration & login

Expense CRUD operations

Category-wise visualization

Daily, monthly, total analytics

🐳 Containerized Deployment

Multi-container orchestration using Docker Compose

Backend waits for PostgreSQL health before starting

Nginx serves production React build

📈 Full Monitoring Setup

Metrics collected from:

Backend (FastAPI /metrics)

Node Exporter (system)

cAdvisor (Docker containers)

Prometheus itself

Grafana with persistent dashboards

🔁 CI/CD Pipeline

Auto build & test backend

Auto build & test frontend

Auto docker build & push on main branch

Ready for auto-deployment to EC2

☁ Infrastructure as Code

Terraform provisions:

EC2

Security Group

SSH Key Pair

Elastic IP

📂 Project Structure
Two-Tier-DevOps/
│── backend/
│   ├── app/
│   │   ├── auth.py
│   │   ├── crud.py
│   │   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
│── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
│
│── nginx/
│   └── default.conf
│
│── prometheus.yml
│── docker-compose.yml
│
│── .github/workflows/
│   ├── backend-ci.yml
│   ├── frontend-ci.yml
│   └── ci-cd.yml
│
└── README.md

🚀 How to Deploy (EC2)
1. Clone repo
git clone https://github.com/gagansingh3467-pixel/Two-Tier-DevOps
cd Two-Tier-DevOps

2. Install Docker
sudo apt update
sudo apt install docker.io docker-compose-plugin -y
sudo systemctl enable docker
sudo usermod -aG docker $USER

3. Deploy
docker compose up -d --build

📊 Monitoring Endpoints
Service	URL
Frontend	http://<EC2-IP>
Backend API	http://<EC2-IP>:8000
Prometheus	http://<EC2-IP>:9090
Grafana	http://<EC2-IP>:3000
cAdvisor	http://<EC2-IP>:8080
Node Exporter	http://<EC2-IP>:9100/metrics
📈 Grafana Dashboards Include

System resource usage

Docker container CPU/Mem/IO

API performance

Request latency

DB query metrics

⚙️ Terraform Deployment
Initialize Terraform
terraform init

Apply infrastructure
terraform apply -auto-approve


Terraform provisions:

EC2 instance

Elastic IP

Security Group

Key Pair

🔄 CI/CD Pipelines
backend-ci.yml

Installs Python

Runs tests

Builds Docker image

frontend-ci.yml

Installs Node

Runs tests

Builds production bundle

ci-cd.yml

On push to main:

Builds backend + frontend Docker images

Pushes to GitHub Container Registry

📸 Screenshots (Add your images here)
![App Dashboard](screenshots/dashboard.png)
![Grafana](screenshots/grafana.png)
![Prometheus Targets](screenshots/prometheus_targets.png)
![Architecture Diagram](screenshots/architecture.png)


Create a folder:

mkdir screenshots


Drop your images in, and they will automatically show.

🧑‍💼 Why This Project Is Valuable for Recruiters

This project demonstrates REAL DevOps experience:

✔ Infrastructure provisioning
✔ Container orchestration
✔ Monitoring & alerting
✔ CI/CD automation
✔ Reverse proxy configuration
✔ Secure environment variables
✔ Microservices understanding

This is exactly what companies expect from DevOps engineers.

🤝 Contact

Gagandeep Singh
GitHub: https://github.com/gagansingh3467-pixel

Open to DevOps engineering roles!