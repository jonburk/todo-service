# TODO List Service

## Overview
Swagger docs generated by the [swagger-codegen](https://github.com/swagger-api/swagger-codegen) project.  By using the [OpenAPI-Spec](https://github.com/OAI/OpenAPI-Specification) from a remote server, you can easily generate a server stub.

### Pre-requisites
This project is built around Node, AWS, Terraform, and Google OAuth2. Note that Docker is used as well, but only by AWS CodeBuild

#### Required tools
- Node
- AWS CLI
- Terraform CLI

#### Required accounts
- AWS
- Terraform Cloud

### Environment variables
| Variable          | Example                       | Description             |
|-------------------|-------------------------------|-------------------------|
| NODE_ENV          | development\|test\|production | Environment             |
| TODO_SERVICE_PORT | 8080                          | Port for the REST API   |
| AWS_REGION        | us-east-2                     | Required by the AWS SDK |

### Terraform variables
The following variables must be set in ./terraform/terraform.tfvars

| Variable                | Example                                                   | Description                                                                                                                          |
|-------------------------|-----------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| aws_region              | us-east-2                                                 | AWS region in which to host resources                                                                                                |
| ui_github_repo          | user/todo-ui                                              | GitHub repo for the UI source                                                                                                        |
| service_github_repo     | user/todo-service                                         | GitHub repo for the service source                                                                                                   |
| domain_name             | todo.example.com                                          | Domain name for the application                                                                                                      |
| mongodb_username        | user                                                      | MongoDB username                                                                                                                     |
| mongodb_password        | secret                                                    | MongoDB password                                                                                                                     |
| mongodb_replica_set     | Cluster0-shard-0                                          | MongoDB replica set                                                                                                                  |
| mongodb_collection      | tasklist                                                  | MongoDB collection for the production data                                                                                           |
| mongodb_cicd_collection | tasklist-test                                             | MongoDB collection that can be used for running automated tests. Note that the test scripts will DELETE all data in this collection. |
| mongodb_seed_list       | [cluster0-shard0-00-00..., cluster0-shard0-00-01..., etc] | MongoDB seed list used to construct a connection string                                                                              |
| session_secret          | secret                                                    | Session secret (generate this randomly)                                                                                              |
| oauth_client_id         | 1234567890.apps.googleusercontent.com                     | Google OAuth2 client ID                                                                                                              |
| oauth_client_secret     | secret                                                    | Google OAuth2 secret                                                                                                                 |

### Manual steps
Terraform will create a cert for the domain name. If the domain is hosted outside of AWS, this needs to be verified via a confirmation email.

Terraform will create a GitHub connection for AWS CodePipeline. This requires a manual step to complete. From the AWS Console, edit the CodePipeline Source phase and click the button to complete the GitHub connection.

Using Terraform Cloud requires setting the organization name and workspace. Create a file called `./terraform/backend.hcl`:

```
workspaces { name = "my_workspace" }
hostname = "app.terraform.io"
organization = "my_organization"
```

### Running the server locally

To run the server, run:

```
npm run start
```

To view the Swagger UI interface:

```
open http://localhost:8080/docs
```

This project leverages the mega-awesome [swagger-tools](https://github.com/apigee-127/swagger-tools) middleware which does most all the work.
