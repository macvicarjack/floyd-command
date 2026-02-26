import sys
sys.path.insert(0, '/Users/floydbot/projects/floyd-command/backend')
from app import app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=False)
