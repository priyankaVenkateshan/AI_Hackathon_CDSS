#!/bin/bash
# Verify all Terraform-created resources exist and are accessible
# Runs all checks and reports each; does not stop on first failure

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

check() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $2"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}✗${NC} $2"
    ((FAILED++))
    return 1
  fi
}

echo "========================================"
echo "Verifying Emergency Medical Triage AWS Resources"
echo "========================================"

# Get outputs from Terraform (or use defaults if terraform not in path)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load secrets if present
[ -f secrets.env ] && source secrets.env

if command -v terraform &>/dev/null; then
  BUCKET=$(terraform output -raw s3_bucket_name 2>/dev/null || echo "emergency-medical-triage-dev-197542484821")
  API_URL=$(terraform output -raw api_gateway_url 2>/dev/null || echo "https://vrxlwtzfff.execute-api.us-east-1.amazonaws.com/dev/")
  HEALTH_URL=$(terraform output -raw api_gateway_health_url 2>/dev/null || echo "https://vrxlwtzfff.execute-api.us-east-1.amazonaws.com/dev/health")
  POLICY_ARN=$(terraform output -raw bedrock_policy_arn 2>/dev/null || echo "arn:aws:iam::197542484821:policy/emergency-medical-triage-dev-bedrock-invoke")
  CLUSTER_ID="emergency-medical-triage-dev-aurora-cluster"
else
  BUCKET="emergency-medical-triage-dev-197542484821"
  API_URL="https://vrxlwtzfff.execute-api.us-east-1.amazonaws.com/dev/"
  HEALTH_URL="https://vrxlwtzfff.execute-api.us-east-1.amazonaws.com/dev/health"
  POLICY_ARN="arn:aws:iam::197542484821:policy/emergency-medical-triage-dev-bedrock-invoke"
  CLUSTER_ID="emergency-medical-triage-dev-aurora-cluster"
fi

echo ""
echo "1. S3 Bucket"
aws s3api head-bucket --bucket "$BUCKET" &>/dev/null
check $? "S3 bucket exists: $BUCKET"

echo ""
echo "2. API Gateway"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -H "Content-Type: application/json" "$HEALTH_URL" 2>/dev/null || echo "000")
[ "$HTTP_CODE" = "200" ]
check $? "Health endpoint responds (HTTP $HTTP_CODE expected 200): $HEALTH_URL"

echo ""
echo "3. RDS Aurora Cluster"
aws rds describe-db-clusters --db-cluster-identifier "$CLUSTER_ID" --query 'DBClusters[0].Status' --output text 2>/dev/null | grep -q "available"
check $? "Aurora cluster exists and is available"

echo ""
echo "4. Bedrock IAM Policy"
aws iam get-policy --policy-arn "$POLICY_ARN" --query 'Policy.Arn' --output text &>/dev/null
check $? "Bedrock invoke policy exists"

echo ""
echo "5. VPC"
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=*emergency-medical-triage*" --query 'Vpcs[0].VpcId' --output text 2>/dev/null || echo "")
if [ -n "$VPC_ID" ] && [ "$VPC_ID" != "None" ]; then
  check 0 "VPC exists: $VPC_ID"
else
  # Fallback: check by CIDR
  VPC_ID=$(aws ec2 describe-vpcs --filters "Name=cidr,Values=10.0.0.0/16" --query 'Vpcs[0].VpcId' --output text 2>/dev/null || echo "")
  [ -n "$VPC_ID" ] && [ "$VPC_ID" != "None" ]
  check $? "VPC exists"
fi

echo ""
echo "6. Aurora Security Group"
SG_COUNT=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=*aurora*" --query 'length(SecurityGroups)' --output text 2>/dev/null || echo "0")
[ "$SG_COUNT" -gt 0 ] 2>/dev/null
check $? "Aurora security group exists"

echo ""
echo "========================================"
echo -e "Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"
echo "========================================"

[ $FAILED -eq 0 ] && exit 0 || exit 1
