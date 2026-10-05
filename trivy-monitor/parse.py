#!/usr/bin/env python3
import json, glob, os, time

REPORTS = '/opt/trivy-monitor/reports'
lines = ['trivy_last_scan_timestamp %d' % int(time.time())]

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
    for sev, n in counts.items():
        lines.append('trivy_vulnerabilities{image="%s",severity="%s"} %d' % (image, sev, n))

with open('/opt/trivy-monitor/metrics.prom', 'w') as f:
    f.write('\n'.join(lines) + '\n')
print('\n'.join(lines))