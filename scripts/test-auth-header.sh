#!/bin/bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NWEzYTY3Yy0wOTgyLTRmMzItODdjZi1iNGIxNzA5NjIxZjIiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc2MDEyMDkxOCwiZXhwIjoxNzYwMjA3MzE4fQ.3MfXOmc3rdMXGmpUeSUDLhoqg0yn7HH05-t-Ax8XcCw"

echo "=== 使用Authorization Header测试 ==="
curl -s http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
