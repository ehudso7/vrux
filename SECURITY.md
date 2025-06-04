# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of VRUX seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to security@vrux.dev. You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the requested information listed below (as much as you can provide) to help us better understand the nature and scope of the possible issue:

* Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
* Full paths of source file(s) related to the manifestation of the issue
* The location of the affected source code (tag/branch/commit or direct URL)
* Any special configuration required to reproduce the issue
* Step-by-step instructions to reproduce the issue
* Proof-of-concept or exploit code (if possible)
* Impact of the issue, including how an attacker might exploit the issue

### What to Expect

* Within 48 hours, we will acknowledge receipt of your report
* Within 7 days, we will provide a detailed response indicating the next steps
* We will keep you informed of the progress towards a fix and full announcement
* We may ask for additional information or guidance

## Security Measures

VRUX implements several security measures:

### API Security
- Rate limiting on all endpoints
- Input validation and sanitization
- Secure API key management

### Code Generation Security
- Generated code is sanitized to prevent XSS
- Sandbox validation for generated components
- No execution of user-provided code on the server

### Data Protection
- Session-based authentication with HTTP-only cookies
- Environment variables for sensitive configuration
- No permanent storage of user prompts or generated code

### Infrastructure
- HTTPS enforcement in production
- Security headers (CSP, HSTS, X-Frame-Options)
- Regular dependency updates

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine the affected versions
2. Audit code to find any potential similar problems
3. Prepare fixes for all releases still under maintenance
4. Release new security fix versions

## Comments on this Policy

If you have suggestions on how this process could be improved, please submit a pull request.