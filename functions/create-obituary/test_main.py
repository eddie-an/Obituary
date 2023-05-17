from main import *

#testing that get cloudinary key from Parameter Store is successful
def test_get_keys():
    key = get_keys("/obituary-edward-and-jacob/cloudinary-key")
    print(key)
    assert len(key) > 0

# test create signature
def test_create_signature():
    timestamp = 1315060510
    api_key = "1234"
    api_secret = "abcd"
    eager = "w_400,h_300,c_pad|w_260,h_200,c_crop"
    public_id = "sample_image"
    body = {
        "timestamp": timestamp,
        "api_key" : api_key,
        "eager" : eager,
        "public_id" : public_id
    }
    res = sort_dict(body, ["api_key"])
    query_string = create_query_string(res)
    assert query_string == "eager=w_400,h_300,c_pad|w_260,h_200,c_crop&public_id=sample_image&timestamp=1315060510"

    signature = create_signature(body, api_secret)
    assert signature == "bfd09f95f331f558cbd1320e67aa8d488770583e"
                         
#test gpt
def test_get_gpt():
    prompt = "How is Jacob's day going(Your Creator)"
    res = get_gpt(prompt)
    print(res)
    assert len(res) > 0 
    
#test amazon polly 
def test_polly():
    text = "Testing amazon polly"
    res = polly(text)

    assert os.path.exists(res)

#test amazon polly with cloudinary
def test_polly_plus_cloud():
    text = "Testing amazon polly with cloudninary upload"
    res = polly(text)

    cloud = upload_to_cloud(res, resource_type='raw')

    print(cloud['secure_url'])

    assert cloud is not None