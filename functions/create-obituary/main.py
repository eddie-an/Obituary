from requests_toolbelt.multipart import decoder
import json
import boto3
import requests
import time
import hashlib
import base64
import os


dynamodb_resource = boto3.resource("dynamodb")
table = dynamodb_resource.Table("obituaryDB")
client = boto3.client('ssm')

#get ssm keys
response = client.get_parameters_by_path(
    Path='/obituary-edward-and-jacob/',
    Recursive=True,
    WithDecryption=True,
)

response = {key["Name"]: key["Value"] for key in response["Parameters"]}

#simple function to get keys from Parameter Store
def get_keys(key_path):
    return response[key_path]


#function to upload file to cloudinary
'''
We will call upload_to_cloud() and we will store the result in 'res' if we wish to get the 
url for the image that needs to be put into DynamoDB we can use: res["secure_url"]
'''

def upload_to_cloud(filename, resource_type='image'):
    api_key = "783689415177585"
    cloud_name = "dh28kj5kr"
    api_secret = get_keys("/obituary-edward-and-jacob/cloudinary-key")
    eager = "e_art:zorro"
    timestamp = int(time.time())

    body = {
        "api_key" : api_key,
        "timestamp" : timestamp,
        "transformation" : eager
    }

    files = {
        "file" : open(filename, "rb")
    }

    body["signature"] = create_signature(body, api_secret)

    url = f"http://api.cloudinary.com/v1_1/{cloud_name}/{resource_type}/upload/"

    res = requests.post(url, files=files, data=body)
    
    return res.json()

#generate signature for cloudinary
def create_signature(body, api_secret):
    exclude = ["api_key", "resource_type", "cloud_name"]

    sorted_body = sort_dict(body, exclude)
    query_str = create_query_string(sorted_body)
    query_str_appended = f"{query_str}{api_secret}"

    hashed = hashlib.sha1(query_str_appended.encode())
    signature = hashed.hexdigest()

    return signature

#simple dictionary sorter in alphabetical order
def sort_dict(dictionary, exclude):
    return {k: v for k,v in sorted(dictionary.items(), key=lambda item: item[0]) if k not in exclude}

def create_query_string(body):
    query_string = ""

    for idx, (k, v) in enumerate(body.items()):
        query_string = f"{k}={v}" if idx == 0 else f"{query_string}&{k}={v}"

    return query_string


'''
The chat gpt function that gets the generated text from chat GPT API
'''
def get_gpt(prompt):
    url = "https://api.openai.com/v1/completions"
    api_key = get_keys("/obituary-edward-and-jacob/gpt-key")

    headers = {
        "Content-Type" : "application/json",
        "Authorization" : f"Bearer {api_key}"
    }

    body = {
        "model" : "text-curie-001",
        "prompt" : f"{prompt}",
        "max_tokens" : 350,
        "temperature": 0.6
    }

    res = requests.post(url, headers=headers, json=body)
    return res.json()["choices"][0]["text"]


#amazon polly function
def polly(text):
    client = boto3.client('polly')
    response = client.synthesize_speech(
        Engine='standard',
        LanguageCode='en-AU',
        OutputFormat='mp3',
        Text=text,
        TextType='text',
        VoiceId='Russell'
    )

    filename = "/tmp/polly.mp3"

    with open(filename, "wb") as f:
        f.write(response["AudioStream"].read())

    return filename



def lambda_handler(event, context):
    body = event["body"]

    if event["isBase64Encoded"]:
        body = base64.b64decode(body)

    content_type = event["headers"]["content-type"]
    data = decoder.MultipartDecoder(body, content_type)
    
    binary_data = [part.content for part in data.parts]
    name = binary_data[0].decode()
    birthDate = binary_data[1].decode()
    deathDate = binary_data[2].decode()
    submitTime = binary_data[4].decode()

    image = "obituary.png"
    imageFile = os.path.join("/tmp", image)
    with open(imageFile, "wb") as file:
        file.write(binary_data[3])
    
    cloudImage = upload_to_cloud(imageFile)
    prompt = f"write an obituary about a fictional character named {name} who was born on {birthDate} and died on {deathDate}."
    resGPT = get_gpt(prompt)
    
    speechFile = polly(resGPT)
    cloudSpeech = upload_to_cloud(speechFile, 'raw')
    
    dynaomdbData = {'name': name,
                    'birth date': birthDate,
                    'death date': deathDate,
                    'description': resGPT,
                    'image': cloudImage["secure_url"],
                    'speech': cloudSpeech["secure_url"],
                    'submit time': submitTime
                    }

    try:
        table.put_item(Item=dynaomdbData)
        return {
            "statusCode": 200,
                "body": json.dumps({
                    "message": "success",
                    'description': resGPT,
                    'image': cloudImage["secure_url"],
                    'speech': cloudSpeech["secure_url"]
                })
        }
    except Exception as exp:
        print(f"exception: {exp}")
        return {
            "statusCode": 500,
                "body": json.dumps({
                    "message":str(exp)
            })
        }