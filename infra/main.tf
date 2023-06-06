terraform {
  required_providers {
    aws = {
      version = ">= 4.0.0"
      source  = "hashicorp/aws"
    }
  }
}

provider "aws" {
  region = "ca-central-1"
}

# two lambda functions w/ function url
# one dynamodb table
# roles and policies as needed
# step functions (if you're going for the bonus marks)


# locals block to declare constants
locals {
  function_create_obituary = "create-obituary-30142179"
  function_get_obituaries  = "get-obituaries-30142179"
  handler_name             = "main.lambda_handler"
  artifact_name            = "artifact.zip"
}


# create a role for the Lambda function to assume
resource "aws_iam_role" "lambda" {
  name               = "iam-for-the-last-show-lambda"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

# policy for logging lamdbda function on cloudwatch
resource "aws_iam_policy" "log" {
  name        = "the-last-show-lambda-logging"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:*:*:*"
        ],
      "Effect": "Allow"
    }
  ]
}
EOF
}

# policy for reading and writing from/to dynamodb with lambda function
resource "aws_iam_policy" "dynamodb" {
  name        = "the-last-show-dynamodb"
  description = "IAM policy for interacting with dynamodb from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Scan"
      ],
      "Resource": [
        "${aws_dynamodb_table.obituary-30147405.arn}"
        ],
      "Effect": "Allow"
    }
  ]
}
EOF
}

/*
 * policy for using parameter store with lambda function
 * for "Resource", the long string of numbers is the AWS Account ID (must be changed for whoever wants to configure the backend)
 */
resource "aws_iam_policy" "parameter_store" {
  name        = "the-last-show-parameter-store"
  description = "IAM policy for ssm key fetch and decryption from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "ssm:GetParametersByPath",
        "kms:Decrypt"
      ],
      "Resource": [
        "arn:aws:ssm:ca-central-1:228775797536:parameter/the-last-show-edward-and-jacob/",
        "arn:aws:kms:ca-central-1:228775797536:key/c531aee2-2247-4d3c-bd1a-1330532571cc"
        ],
      "Effect": "Allow"
    }
  ]
}
EOF
}

# policy for using polly with lambda function
resource "aws_iam_policy" "polly" {
  name        = "the-last-show-polly"
  description = "IAM policy for polly text-to-speech from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "polly:SynthesizeSpeech"
      ],
      "Resource": [
        "*"
        ],
      "Effect": "Allow"
    }
  ]
}
EOF
}

# attach the above policies to the function role
resource "aws_iam_role_policy_attachment" "lambda_logging" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.log.arn
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.dynamodb.arn
}

resource "aws_iam_role_policy_attachment" "lambda_parameter_store" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.parameter_store.arn
}

resource "aws_iam_role_policy_attachment" "lambda_polly" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.polly.arn
}

# dynamodb table
resource "aws_dynamodb_table" "obituary-30147405" {
  name         = "obituary-30147405"
  billing_mode = "PROVISIONED"

  # up to 8KB read per second (eventually consistent)
  read_capacity = 1

  # up to 1KB per second
  write_capacity = 1

  # we only need a name to find an item in the table; therefore, we 
  # don't need a sort key here
  hash_key = "name"

  # the hash_key data type is string
  attribute {
    name = "name"
    type = "S"
  }
}

# creating archive file for create-obituary
data "archive_file" "create_obituary" {
  type        = "zip"
  source_dir  = "../functions/create-obituary"
  output_path = "../functions/create-obituary/artifact.zip"
}

# creating archive file for get-obituaries
data "archive_file" "get_obituaries" {
  type        = "zip"
  source_dir  = "../functions/get-obituaries"
  output_path = "../functions/get-obituaries/artifact.zip"
}

# create a Lambda function for create obituary file
# see the docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function
resource "aws_lambda_function" "lambda_create_obituary" {
  role             = aws_iam_role.lambda.arn
  function_name    = local.function_create_obituary
  handler          = local.handler_name
  filename         = "../functions/create-obituary/${local.artifact_name}"
  source_code_hash = data.archive_file.create_obituary.output_base64sha256
  timeout          = 20

  # see all available runtimes here: https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime
  runtime = "python3.9"
}

# create a Lambda function for get obituaries file
# see the docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function
resource "aws_lambda_function" "lambda_get_obituaries" {
  role             = aws_iam_role.lambda.arn
  function_name    = local.function_get_obituaries
  handler          = local.handler_name
  filename         = "../functions/get-obituaries/${local.artifact_name}"
  source_code_hash = data.archive_file.get_obituaries.output_base64sha256
  timeout          = 20

  # see all available runtimes here: https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime
  runtime = "python3.9"
}


# create a Function URL for Lambda create obituary
resource "aws_lambda_function_url" "url_create_obituary" {
  function_name      = aws_lambda_function.lambda_create_obituary.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["POST"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}

# create a Function URL for Lambda get obituaries
resource "aws_lambda_function_url" "url_get_obituaries" {
  function_name      = aws_lambda_function.lambda_get_obituaries.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["GET"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}

# show the Function URL after creation
output "lambda_url_create_obituary" {
  value = aws_lambda_function_url.url_create_obituary.function_url
}

output "lambda_url_get_obituaries" {
  value = aws_lambda_function_url.url_get_obituaries.function_url
}
