# 🤖 PrimeDFit 
A Progressive Web Application featuring a LLM Fitness Assistant!

**IMPORTANT NOTE:** You need a .env file for the front-end, contact the dev to access it

### 🛠️ Tech Stack
- **Frontend**: Javascript, React, Tailwind CSS
- **Backend**: Python, Django, Django Rest Framework

## 🚀 Getting Started
**Prerequisites**
- Node.js
- Python 3

### Installation
1. Clone the repo:
```
https://github.com/Snooze03/Thesis-2.git
```

### Getting Started
1. Create a python virtual environment
```bash
py -m venv .venv
```
2. Activate virtual environment
```bash
./venv/Scripts/Activate.ps1
```
3. Install dependencies
```bash
cd ./client
pnpm install

cd ../server
pip install -r ./requirements.txt
```
5. Make migrations
```bash
cd ./server/backend
py manage.py makemigrations
py manage.py migrate
```
6. Run the server
```bash
cd ./client
pnpm run dev

cd ../server
py manage.py runserver
```

## 🖥️ Deployment
- To be deployed at hostinger
