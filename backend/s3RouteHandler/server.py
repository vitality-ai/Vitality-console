from flask import Flask, request, jsonify,Response
from s3RouteHandler.storageServiceClient import ciaos_client
import json
import hashlib
from s3RouteHandler.sigv4_middleware import init_sigv4

app = Flask(__name__)

init_sigv4(app)

# Simulate a storage in memory (for simplicity)
storage = {}

@app.route('/<bucket>/<key>', methods=['PUT'])
def put_object(bucket, key):
    """Handle PUT requests to store an object."""
    # Get the body of the request (this is the object data being uploaded)
    body = request.data
    headers = dict(request.headers)
    
    # Simulate storing the object in memory
    storage[key] = body

    print(f"Received PUT request for bucket: {bucket}, key: {key}")
    print("Headers:", json.dumps(headers, indent=4))
    print("Body:", body.decode("utf-8"))
    
    # Compute ETag (MD5 checksum of the object)
    etag_value = compute_md5_hex(body)
    
    # Simulate the actual upload by calling external client
    body = [body]
    ciaos_client.put_binary(key, body)
    
    # Return an empty XML response with appropriate headers
    response = Response(status=200, response="", mimetype="application/xml")
    response.headers["ETag"] = f"\"{etag_value}\""  # Add ETag header
    
    return response

def compute_md5_hex(body):
    """Calculate MD5 checksum of the body and return it as a hex string."""
    md5_hash = hashlib.md5()
    md5_hash.update(body)
    return md5_hash.hexdigest()

@app.route('/<bucket>/<key>', methods=['GET'])
def get_object(bucket, key):
    """Handle GET requests to retrieve an object."""
    # Retrieve the object from storage
    raw = ciaos_client.get(key)
    # normalise to pure bytes ─ the 3 common cases
    if isinstance(raw, list):            # list of bytearray / bytes
        raw = b"".join(bytes(chunk) for chunk in raw)
    elif isinstance(raw, bytearray):     # single bytearray
        raw = bytes(raw)                 # → bytes

    print(f"Received GET request for bucket={bucket}, key={key}")
    print("Headers:", json.dumps(dict(request.headers), indent=4))
    print("Body length:", len(raw), "bytes")

    resp = Response(raw,
                    status=200,
                    mimetype="application/octet-stream")
    resp.headers["Content-Length"] = str(len(raw))   # good practice
    # resp.headers["ETag"] = '"' + compute_md5_hex(raw) + '"'     # optional
    return resp



@app.route('/<bucket>/<key>', methods=['DELETE'])
def delete_object(bucket, key):
    """Handle DELETE requests to remove an object."""
    print("In delete method storage ",storage)
    ciaos_client.delete(key)
    if key in storage:
        del storage[key]
        headers = dict(request.headers)
        print(f"Received DELETE request for bucket: {bucket}, key: {key}")
        print("Headers:", json.dumps(headers, indent=4))
        raw = ciaos_client.delete(key)
        return jsonify({"message": "Object deleted successfully"}), 200
    else:
        return jsonify({"error": "Object not found"}), 404



