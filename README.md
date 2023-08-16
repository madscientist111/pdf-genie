# pdf-genie

Docker image-based AWS Lambda function in Node.js that converts any document format that LibreOffice can import into any document format that LibreOffice can export, and a thumbnail image.

based on [javidlakha/unofuction](https://github.com/javidlakha/unofunction).

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
