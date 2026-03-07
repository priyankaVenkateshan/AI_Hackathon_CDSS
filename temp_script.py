import urllib.request, json
req = urllib.request.Request('http://localhost:8081/api/v1/agent', data=b'{"message": "Hello, can you help me understand my symptoms?"}', method='POST')
req.add_header('X-CDSS-Role', 'doctor')
req.add_header('Content-Type', 'application/json')
res = urllib.request.urlopen(req, timeout=30)
data = json.loads(res.read())
print(json.dumps(data, indent=2))
