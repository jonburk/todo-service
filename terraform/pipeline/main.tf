data "aws_region" "current" {}

resource "aws_codepipeline" "codepipeline" {
  name = var.app_short_name

  role_arn = aws_iam_role.pipeline_iam_role.arn

  artifact_store {
    location = aws_s3_bucket.codepipeline_bucket.bucket
    type     = "S3"
  }

  stage {
    name = "Source"

    action {
      name     = "ServiceSource"
      category = "Source"
      owner    = "AWS"
      provider = "CodeStarSourceConnection"
      version  = "1"

      configuration = {
        BranchName           = "master"
        ConnectionArn        = aws_codestarconnections_connection.github_connection.arn
        FullRepositoryId     = var.service_github_repo
        OutputArtifactFormat = "CODE_ZIP"
      }

      namespace = "ServiceSourceVariables"

      output_artifacts = [
        "ServiceSourceArtifact"
      ]
    }

    action {
      name     = "UISource"
      category = "Source"
      owner    = "AWS"
      provider = "CodeStarSourceConnection"
      version  = "1"

      configuration = {
        BranchName           = "master"
        ConnectionArn        = aws_codestarconnections_connection.github_connection.arn
        FullRepositoryId     = var.ui_github_repo
        OutputArtifactFormat = "CODE_ZIP"
      }

      namespace = "UISourceVariables"

      output_artifacts = [
        "UISourceArtifact"
      ]
    }
  }

  stage {
    name = "Build"

    action {
      name     = "Build"
      category = "Build"
      owner    = "AWS"
      provider = "CodeBuild"
      version  = "1"

      configuration = {
        PrimarySource = "ServiceSourceArtifact"
        ProjectName   = var.codebuild_project_name
      }

      input_artifacts = [
        "ServiceSourceArtifact",
        "UISourceArtifact"
      ]

      output_artifacts = [
        "BuildOutputArtifacts"
      ]
    }
  }

  stage {
    name = "Deploy"

    action {
      name     = "Deploy"
      category = "Deploy"
      owner    = "AWS"
      provider = "ECS"
      version  = "1"

      configuration = {
        ClusterName = var.ecs_cluster_name
        FileName    = "imagedefinitions.json"
        ServiceName = var.ecs_service_name
      }

      input_artifacts = [
        "BuildOutputArtifacts"
      ]

      namespace = "DeployVariables"
    }
  }
}

resource "aws_s3_bucket" "codepipeline_bucket" {
  bucket = "codepipeline-${data.aws_region.current.name}-${var.app_short_name}"
}

resource "aws_iam_policy" "pipeline_iam_policy" {
  name        = "AWSCodePipelineServiceRole-${data.aws_region.current.name}-${var.app_short_name}"
  description = "Policy used in trust relationship with CodePipeline"
  path        = "/service-role/"

  policy = file("${path.module}/policy.json")
}

resource "aws_iam_role" "pipeline_iam_role" {
  name = "AWSCodePipelineServiceRole-${data.aws_region.current.name}-${var.app_short_name}"
  path = "/service-role/"

  managed_policy_arns = [
    aws_iam_policy.pipeline_iam_policy.arn
  ]

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_codestarconnections_connection" "github_connection" {
  name          = "${var.app_short_name}-github-connection"
  provider_type = "GitHub"
}

