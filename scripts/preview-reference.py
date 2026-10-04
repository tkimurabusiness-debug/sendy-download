"""保存したArc原版の描画ランタイムを使うローカル比較用サーバー。"""
import argparse
from pathlib import Path
import runpy
import sys

parser = argparse.ArgumentParser()
parser.add_argument('--fonts-dir', type=Path, required=True)
parser.add_argument('--port', type=int, default=8879)
parser.add_argument('--base-path', default='')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
original = args.fonts_dir.resolve().parent
server = original.parent / 'serve-original.py'
if not server.is_file() or not (original / 'query-resources.json').is_file():
    parser.error('Arc原版の保存先とserve-original.pyが必要です')
sys.argv = [str(server), '--port', str(args.port), '--index', str(root / 'index.html'),
            '--app-root', str(root), '--base-path', args.base_path]
runpy.run_path(str(server), run_name='__main__')
