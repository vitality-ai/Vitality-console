# storageServiceClient
from ciaos import Ciaos,Config
import ciaos
print(ciaos.__file__)
# Initialize Config
config = Config(
    user_id="user_id", 
    api_url="http://localhost:9710",
    user_access_key="xxxx"
)

# Initialize CIAOS Client
ciaos_client = Ciaos(config)

# ciaos_client.put(file_path="C:/Users/admin/lunoos/projects/storageService/Storage-service/client/python-sdk/TestFile.txt", key="unique")
# ciaos_client.put(file_path="C:/Users/admin/Downloads/faceemoji.png", key="unique2")
 

# data = ciaos_client.get(key="unique2")