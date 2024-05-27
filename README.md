# pdf-genie

Docker image-based AWS Lambda function in Node.js that converts any document format that LibreOffice can import into any document format that LibreOffice can export, and a thumbnail image.

based on [javidlakha/unofuction](https://github.com/javidlakha/unofunction).

<div style="text-align:center;">
    <img src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/40338822-69bc-4fb6-9bc4-b87553f4542d/df9hyf9-d9fb64e1-5c58-46b8-94db-baed525ea10a.jpg/v1/fill/w_1280,h_1111,q_75,strp/30th_anniversary_of_aladdin_by_brazilianferalcat_df9hyf9-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTExMSIsInBhdGgiOiJcL2ZcLzQwMzM4ODIyLTY5YmMtNGZiNi05YmM0LWI4NzU1M2Y0NTQyZFwvZGY5aHlmOS1kOWZiNjRlMS01YzU4LTQ2YjgtOTRkYi1iYWVkNTI1ZWExMGEuanBnIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.Y5156TNDx3ceVL7YAIOpQCcTVpMp2KQsS1jcDYwFtsE" width="300" height="auto" />
    <p>Artwork by <a href="https://www.deviantart.com/brazilianferalcat/art/30th-Anniversary-of-Aladdin-922946949">brazilianferalcat</a></p>
</div>


## Deployment at AWS
* Create a new repositery
* Go to view push commands

![Screenshot of View push commands on AWS ECR repo page](https://awsstage-test.s3.amazonaws.com/100001/1aef983a-2a5c-4061-902e-db8cba301d2e.png "View push commands")

* Follow the steps mentioned in the pop-up
* After deploying the image to ECR, set up a new container image Lambda function by providing the latest uploaded ECR Container Image URL from the previous steps

![Screenshot of Create Container Image Lambda Function](https://awsstage-test.s3.amazonaws.com/100001/0efd282c-4605-4475-ae1c-a8a609bd0cd3.png "Create container image lambda function")

Check out this detailed and very easy to follow [article](https://www.freecodecamp.org/news/build-and-push-docker-images-to-aws-ecr/) for step by step tutorial!

## How to run locally
* Ensure [Docker](https://www.docker.com/) is installed on your system.

1. Building the image
```
docker build -t pdf-genie:latest .
```

2(a). Running the image (x86_64)
```
docker run -p 9000:8080 pdf-genie:latest
```

2(b). Running the image (Mac M1-M2)
```
docker run --platform linux/amd64 -p 9000:8080 pdf-genie:latest
```

3. Locally running at
```
http://localhost:9000/2015-03-31/functions/function/invocations
```

for more details - [AWS Docs](https://docs.aws.amazon.com/lambda/latest/dg/images-test.html).

### Sample Event
If routed through AWS API Gateway,
```
{
    "media_url": "<YOUR-MEDIA-URL>",
    "convert_to": "pdf OR <ANY-OTHER-SUPPORTED-FORMAT>"
}
```

### Supported Libraries
* Libreoffice
* Poppler-Utils (incl. pdfinfo, pdftocairo etc.. )
