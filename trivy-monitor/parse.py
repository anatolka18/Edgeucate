#!/usr/bin/env python3
import json, glob, os, time

REPORTS = '/opt/trivy-monitor/reports'
LOG = '/var/log/trivy-monitor/trivy-report.log'
now = int(time.time())

lines = ['trivy_last_scan_timestamp %d' % now]
log_lines = ['ts=%d event=run_start' % now]

for path in sorted(glob.glob(os.path.join(REPORTS, '*.json'))):
    image = os.path.basename(path)[:-5]
    counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'unknown': 0}
    with open(path) as f:
        data = json.load(f)
    for result in data.get('Results', []):
        for vuln in result.get('Vulnerabilities') or []:
            sev = (vuln.get('Severity') or 'unknown').lower()
            if sev in counts:
                counts[sev] += 1
            title = (vuln.get('Title') or '').replace('"', "'")[:120]
            log_lines.append(
                'ts=%d event=finding image=%s severity=%s id=%s pkg=%s installed=%s fixed=%s title="%s"'
                % (now, image, sev, vuln.get('VulnerabilityID', ''), vuln.get('PkgName', ''),
                   vuln.get('InstalledVersion', ''), vuln.get('FixedVersion', ''), title)
            )
    for sev, n in counts.items():
        lines.append('trivy_vulnerabilities{image="%s",severity="%s"} %d' % (image, sev, n))

with open('/opt/trivy-monitor/metrics.prom', 'w') as f:
    f.write('\n'.join(lines) + '\n')

os.makedirs(os.path.dirname(LOG), exist_ok=True)
with open(LOG, 'a') as f:
    f.write('\n'.join(log_lines) + '\n')

print('\n'.join(lines))