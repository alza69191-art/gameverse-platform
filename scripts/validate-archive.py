#!/usr/bin/env python3
import sys
import zipfile
import stat
import re
from pathlib import PurePosixPath

MAX_ENTRIES = 10000
MAX_TOTAL_UNCOMPRESSED = 1024 * 1024 * 1024
MAX_MEMBER_SIZE = 256 * 1024 * 1024
MAX_RATIO = 100

def fail(message):
    print(message, file=sys.stderr)
    raise SystemExit(2)

if len(sys.argv) != 2:
    fail("usage: validate-archive.py FILE")

try:
    with zipfile.ZipFile(sys.argv[1], "r") as archive:
        entries = archive.infolist()
        if not entries or len(entries) > MAX_ENTRIES:
            fail("invalid or excessive ZIP entry count")
        total = 0
        seen = set()
        for item in entries:
            name = item.filename
            if not name or len(name) > 1024 or "\\" in name or name.startswith(("/", "\\\\")):
                fail("unsafe ZIP entry path")
            if re.match(r"^[A-Za-z]:", name):
                fail("drive-qualified ZIP entry path")
            path = PurePosixPath(name)
            if any(part in ("..", ".") for part in path.parts):
                fail("path traversal entry")
            if name in seen:
                fail("duplicate ZIP entry")
            seen.add(name)
            mode = (item.external_attr >> 16) & 0xFFFF
            if stat.S_ISLNK(mode):
                fail("symbolic links are not accepted")
            if item.flag_bits & 0x1:
                fail("encrypted ZIP entries are not accepted")
            if item.file_size > MAX_MEMBER_SIZE:
                fail("ZIP member exceeds size limit")
            total += item.file_size
            if total > MAX_TOTAL_UNCOMPRESSED:
                fail("expanded archive exceeds size limit")
            if item.file_size > 0:
                if item.compress_size == 0 or item.file_size / item.compress_size > MAX_RATIO:
                    fail("suspicious compression ratio")
        # Validate central directory and CRCs by streaming each entry without extracting.
        for item in entries:
            if item.is_dir():
                continue
            with archive.open(item, "r") as stream:
                while stream.read(1024 * 1024):
                    pass
except (zipfile.BadZipFile, OSError, RuntimeError, EOFError) as exc:
    fail(f"invalid ZIP archive: {exc}")

print("archive validation passed")
