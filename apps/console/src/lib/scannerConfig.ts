// Define what each Python module maps to in the Database structure
// You can add more modules here as you develop them in Python.
export const SCANNER_MODULES = [
  {
    moduleName: 'ftp_anon',
    title: 'Anonymous FTP Enabled',
    severity: 'Medium',
    impact: 5.0,
    factor: 'Network Security',
    description: 'FTP service allows anonymous login which could disclose sensitive information.'
  },
  {
    moduleName: 'directory_listing',
    title: 'Directory Listing Enabled',
    severity: 'Low',
    impact: 2.0,
    factor: 'Application Security',
    description: 'Web server allows directory listing, exposing files or structure.'
  },
  {
    moduleName: 'openssl_vuln',
    title: 'OpenSSL 3.X Vulnerability Detected (CVE-2022-3602)',
    severity: 'Critical',
    impact: 9.8,
    factor: 'Application Security',
    description: 'Target is running a vulnerable OpenSSL 3.0 version (3.0.0 to 3.0.6) susceptible to buffer overflow. Immediate update to 3.0.7+ is required.'
  },
  {
    moduleName: 'redirect_http',
    title: 'Redirect Chain Contains HTTP',
    severity: 'Medium',
    impact: 4.5,
    factor: 'Application Security',
    description: 'The target redirects to or through an insecure HTTP connection, exposing user traffic to potential interception or manipulation (Man-in-the-Middle).'
  },
  {
    moduleName: 'session_cookie_httponly',
    title: "Session Cookie Missing 'HttpOnly' Attribute",
    severity: 'Medium',
    impact: 5.0,
    factor: 'Application Security',
    description: "Session Cookie Missing 'HttpOnly' Attribute. The web application sets session cookies without the 'HttpOnly' flag, allowing potential attackers to steal session tokens via Cross-Site Scripting (XSS)."
  },
  {
    moduleName: 'session_cookie_secure',
    title: "Session Cookie Missing 'Secure' Attribute",
    severity: 'Medium',
    impact: 5.0,
    factor: 'Application Security',
    description: "Session Cookie Missing 'Secure' Attribute. The web application sets session cookies without the 'Secure' flag, allowing the cookie to be transmitted over unencrypted HTTP connections, increasing the risk of Man-in-the-Middle (MITM) attacks."
  },
  {
    moduleName: 'port22_ssh_open',
    title: 'Exposed SSH Port (22) Detected',
    severity: 'Medium',
    impact: 5.0,
    factor: 'Network Security',
    description: 'The SSH service (port 22) is open and accessible from the internet. This could expose the system to brute-force attacks or exploitation of SSH vulnerabilities if not properly secured.'
  }
];
