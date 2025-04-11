import boto3
from botocore.client import Config
import os

# Configuration
access_key = 'mouO4G38dd0X5L4XX3F1'
secret_key = 'FIpxrSW1B6jJcBgjgJ9tqrmOBVSjHd2U4Dnobdks'
endpoint_url = 'http://localhost:8000/s3'  # Adjust if your server is running on a different host/port
file_path = '/home/sisyphus/cj/python/bahmm/kioskgit/kioskbah/uploads/el_2_1743749885_DSC_2562.JPG'

# Create S3 client with minimal configuration
s3_client = boto3.client(
    's3',
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key,
    endpoint_url=endpoint_url,
    region_name='auto',
    # Use v2 signing for simpler authentication
    config=Config(signature_version='s3'),
    # Additional settings to make it work with non-AWS endpoints
    use_ssl=False,
    verify=False,
    config=Config(
        s3={'addressing_style': 'path'},
        signature_version='s3'
    )
)

def test_s3_operations():
    # Test bucket name and object key
    bucket_name = 'test-bucket'
    object_key = os.path.basename(file_path)
    download_path = f'downloaded_{object_key}'

    try:
        # 1. Upload file
        print(f"\n1. Uploading file {object_key} to bucket {bucket_name}...")
        with open(file_path, 'rb') as file:
            # Use put_object instead of upload_fileobj for simpler operation
            s3_client.put_object(
                Bucket=bucket_name,
                Key=object_key,
                Body=file
            )
        print("✓ Upload successful")

        # 2. List objects in bucket
        print(f"\n2. Listing objects in bucket {bucket_name}...")
        response = s3_client.list_objects(Bucket=bucket_name)
        if 'Contents' in response:
            for obj in response['Contents']:
                print(f"Found object: {obj['Key']}, Size: {obj['Size']} bytes")
        print("✓ List operation successful")

        # 3. Download file
        print(f"\n3. Downloading file as {download_path}...")
        with open(download_path, 'wb') as file:
            response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
            file.write(response['Body'].read())
        print("✓ Download successful")

        # 4. Delete file
        print(f"\n4. Deleting file {object_key}...")
        s3_client.delete_object(Bucket=bucket_name, Key=object_key)
        print("✓ Delete successful")

    except Exception as e:
        print(f"Error: {str(e)}")
        # Print more error details
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Make sure you have boto3 installed: pip install boto3
    test_s3_operations()