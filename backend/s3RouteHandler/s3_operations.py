import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('botocore')
logger.setLevel(logging.INFO)

class S3Client:

    
    def __init__(self, bucket_name, access_key, secret_key,custom_endpoint, region='us-east-1'):
        """Initialize S3 client with provided credentials."""
        self.s3 = boto3.client(
            's3',
            endpoint_url=custom_endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region
        )
        self.bucket_name = bucket_name

    def upload_file(self, file_path, object_name):
        """Upload a file to an S3 bucket."""
        try:
            self.s3.upload_file(file_path, self.bucket_name, object_name)
            print(f"File '{file_path}' uploaded to '{self.bucket_name}/{object_name}'.")
        except FileNotFoundError:
            print(f"File '{file_path}' not found.")
        except NoCredentialsError:
            print("Credentials not available.")
        except PartialCredentialsError:
            print("Incomplete credentials provided.")
        except Exception as e:
            print(f"An error occurred: {e}")

    def download_file(self, object_name, file_path):
        """Download a file from an S3 bucket."""
        try:
            self.s3.download_file(self.bucket_name, object_name, file_path)
            print(f"File '{object_name}' downloaded to '{file_path}'.")
        except FileNotFoundError:
            print(f"File '{file_path}' not found.")
        except NoCredentialsError:
            print("Credentials not available.")
        except PartialCredentialsError:
            print("Incomplete credentials provided.")
        except Exception as e:
            print(f"An error occurred: {e}")

    def delete_file(self, object_name):
        """Delete a file from an S3 bucket."""
        try:
            self.s3.delete_object(Bucket=self.bucket_name, Key=object_name)
            print(f"File '{object_name}' deleted from '{self.bucket_name}'.")
        except NoCredentialsError:
            print("Credentials not available.")
        except PartialCredentialsError:
            print("Incomplete credentials provided.")
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == "__main__":
    # Replace these with your actual AWS credentials and bucket name
    ACCESS_KEY = 'dVtT6RrzkmX99PJpFnIq'
    SECRET_KEY = 'pRZjBiGtZQ5riHIVDjGCNb6MXTxPMzYSXJKJQrY8'
    REGION = 'ap-south-1'  # e.g., 'us-east-1'
    BUCKET_NAME = 'lunitestbucket'
    custom_endpoint = "http://localhost:9000"

    s3_client = S3Client(BUCKET_NAME, ACCESS_KEY, SECRET_KEY,custom_endpoint, REGION)

    # Example usage
    # s3_client.upload_file('C:/Users/admin/lunoos/projects/storageService/S3CompatibilityTest/S3Client/testFileforS3Upload.txt', 'test5')
    s3_client.download_file('test5', 'test5.txt')
    # s3_client.delete_file('test4')
