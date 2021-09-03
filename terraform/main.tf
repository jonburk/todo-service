terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~>3.57"
    }
  }

  required_version = "~>1.0"
}

provider "aws" {
  profile = "default"
  region  = var.aws_region

  default_tags {
    tags = {
      Terraform   = "True"
      App         = var.application_name
      Environment = var.environment
    }
  }
}

locals {
  app_short_name     = replace(lower(var.application_name), " ", "-")
  app_name_no_spaces = replace(var.application_name, " ", "")
}

data "aws_availability_zones" "available" {
  state = "available"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~>3.7"

  name = "${local.app_short_name}-vpc"
  cidr = var.vpc_cidr_block

  azs = slice(data.aws_availability_zones.available.names, 0, var.public_subnet_count)
  public_subnets = tolist([
    for i in range(var.public_subnet_count) :
    cidrsubnet(var.vpc_cidr_block, 8, i)
  ])

  enable_dns_hostnames = true
}

module "alb" {
  source = "./alb"

  app_short_name = local.app_short_name
  domain_name    = var.domain_name
  vpc_id         = module.vpc.vpc_id
  subnets        = module.vpc.public_subnets
}

module "ecs" {
  source = "./ecs"

  environment          = var.environment
  app_name             = var.application_name
  app_short_name       = local.app_short_name
  app_name_no_spaces   = local.app_name_no_spaces
  vpc_id               = module.vpc.vpc_id
  public_subnets       = module.vpc.public_subnets
  alb_target_group_arn = module.alb.target_group_arn
  app_port_number      = var.app_port_number
  app_instance_type    = var.app_instance_type
  app_instance_cpu     = var.app_instance_cpu
  app_instance_memory  = var.app_instance_memory
}

module "ecr" {
  source = "./ecr"

  app_short_name = local.app_short_name
}

module "codepipeline" {
  source = "./pipeline"

  app_short_name         = local.app_short_name
  app_name_no_spaces     = local.app_name_no_spaces
  ecs_cluster_name       = module.ecs.cluster_name
  ecs_service_name       = module.ecs.service_name
  service_github_repo    = var.service_github_repo
  ui_github_repo         = var.ui_github_repo
  codebuild_project_name = module.codebuild.project_name
}

module "codebuild" {
  source = "./codebuild"

  app_name_no_spaces = local.app_name_no_spaces
  image_repo_name    = module.ecr.repo_name
}

module "parameterstore" {
  source = "./parameterstore"

  application_name        = var.application_name
  app_name_no_spaces      = local.app_name_no_spaces
  environment             = var.environment
  domain_name             = var.domain_name
  mongodb_username        = var.mongodb_username
  mongodb_password        = var.mongodb_password
  mongodb_seed_list       = var.mongodb_seed_list
  mongodb_replica_set     = var.mongodb_replica_set
  mongodb_collection      = var.mongodb_collection
  mongodb_cicd_collection = var.mongodb_cicd_collection
  session_secret          = var.session_secret
  oauth_client_id         = var.oauth_client_id
  oauth_client_secret     = var.oauth_client_secret
}