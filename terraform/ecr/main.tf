resource "aws_ecr_repository" "ecr_repo" {
  name                 = var.app_short_name
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = data.aws_kms_alias.ecr.target_key_arn
  }
}

data "aws_kms_alias" "ecr" {
  name = "alias/aws/ecr"
}