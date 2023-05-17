import json
import boto3
from boto3.dynamodb.conditions import Key

dynamodb_resource = boto3.resource("dynamodb")
table = dynamodb_resource.Table("obituaryDB")

def lambda_handler(event, context):
    try:
        result = table.scan()
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "success",
                "obituary": result
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