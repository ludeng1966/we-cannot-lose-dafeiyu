"""Serve the portable project with byte-range support for video and audio."""
import argparse
import re
import shutil
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class PreviewHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        self.remaining = None
        range_header = self.headers.get("Range")
        path = Path(self.translate_path(self.path))
        if range_header is None or not path.is_file():
            return super().send_head()

        match = re.fullmatch(r"bytes=(\d*)-(\d*)", range_header)
        if match is None or not any(match.groups()):
            return super().send_head()

        stream = path.open("rb")
        size = path.stat().st_size
        first, last = match.groups()
        start = int(first) if first else max(0, size - int(last))
        end = min(int(last), size - 1) if first and last else size - 1
        if end < start:
            stream.close()
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None

        stream.seek(start)
        self.remaining = end - start + 1
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(str(path)))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(self.remaining))
        self.end_headers()
        return stream

    def copyfile(self, source, outputfile):
        if self.remaining is None:
            shutil.copyfileobj(source, outputfile)
            return

        while self.remaining:
            block = source.read(min(self.remaining, 1024 * 1024))
            if not block:
                break
            outputfile.write(block)
            self.remaining -= len(block)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8760)
    args = parser.parse_args()
    project = Path(__file__).resolve().parent / "project"
    handler = partial(PreviewHandler, directory=str(project))
    with ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        print(f"Preview: http://127.0.0.1:{args.port}/", flush=True)
        server.serve_forever()
