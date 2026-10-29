# Source coverage inventory

This manifest accounts for tracked repository files available to this review. Application source was inventoried by routes, component actions, validators, helpers, schema, migrations and test contracts. Binary assets are accounted for by purpose/path; they do not introduce additional HTTP workflows. Dependencies, `.git`, local secret/configuration files, generated builds and this new documentation are not product-source coverage. Source coverage is not a runtime test-coverage percentage.

## Category totals

| Category | Tracked files |
| --- | --- |
| Admin | 73 |
| Design or static asset | 72 |
| Existing documentation / historical reference | 51 |
| Historical database migration | 21 |
| Identity and public access | 18 |
| Learner | 42 |
| Project configuration / root reference | 124 |
| Schema / operator seeds | 5 |
| Shared source / UI / assets | 173 |
| Tests | 99 |
| Tutor | 63 |

## Per-file accountability

Historical reference/design files are inventoried as context; code/schema decide whether a feature exists. Fonts, images, PDFs, slides and spreadsheets are assets/reference artifacts rather than executable controllers. No feature is inferred solely from their filename.

| File | Review category | Documentation area |
| --- | --- | --- |
| [.claude/settings.json](../../.claude/settings.json) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/01-recon-osint/SKILL.md](../../.claude/skills/01-recon-osint/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/01-recon-osint/examples/example_usage.md](../../.claude/skills/01-recon-osint/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/01-recon-osint/resources/common_subdomains.txt](../../.claude/skills/01-recon-osint/resources/common_subdomains.txt) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/01-recon-osint/scripts/__pycache__/dns_recon.cpython-314.pyc](../../.claude/skills/01-recon-osint/scripts/__pycache__/dns_recon.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/01-recon-osint/scripts/__pycache__/subdomain_enum.cpython-314.pyc](../../.claude/skills/01-recon-osint/scripts/__pycache__/subdomain_enum.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/01-recon-osint/scripts/__pycache__/tech_fingerprint.cpython-314.pyc](../../.claude/skills/01-recon-osint/scripts/__pycache__/tech_fingerprint.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/01-recon-osint/scripts/dns_recon.py](../../.claude/skills/01-recon-osint/scripts/dns_recon.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/01-recon-osint/scripts/subdomain_enum.py](../../.claude/skills/01-recon-osint/scripts/subdomain_enum.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/01-recon-osint/scripts/tech_fingerprint.py](../../.claude/skills/01-recon-osint/scripts/tech_fingerprint.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/02-vulnerability-scanner/SKILL.md](../../.claude/skills/02-vulnerability-scanner/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/02-vulnerability-scanner/examples/example_usage.md](../../.claude/skills/02-vulnerability-scanner/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/02-vulnerability-scanner/scripts/__pycache__/config_auditor.cpython-314.pyc](../../.claude/skills/02-vulnerability-scanner/scripts/__pycache__/config_auditor.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/02-vulnerability-scanner/scripts/__pycache__/dependency_auditor.cpython-314.pyc](../../.claude/skills/02-vulnerability-scanner/scripts/__pycache__/dependency_auditor.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/02-vulnerability-scanner/scripts/config_auditor.py](../../.claude/skills/02-vulnerability-scanner/scripts/config_auditor.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/02-vulnerability-scanner/scripts/cvss_calculator.py](../../.claude/skills/02-vulnerability-scanner/scripts/cvss_calculator.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/02-vulnerability-scanner/scripts/dependency_auditor.py](../../.claude/skills/02-vulnerability-scanner/scripts/dependency_auditor.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/03-exploit-development/SKILL.md](../../.claude/skills/03-exploit-development/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/03-exploit-development/examples/example_usage.md](../../.claude/skills/03-exploit-development/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/03-exploit-development/scripts/__pycache__/payload_generator.cpython-314.pyc](../../.claude/skills/03-exploit-development/scripts/__pycache__/payload_generator.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/03-exploit-development/scripts/payload_generator.py](../../.claude/skills/03-exploit-development/scripts/payload_generator.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/04-reverse-engineering/SKILL.md](../../.claude/skills/04-reverse-engineering/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/04-reverse-engineering/examples/example_usage.md](../../.claude/skills/04-reverse-engineering/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/04-reverse-engineering/scripts/__pycache__/binary_analyzer.cpython-314.pyc](../../.claude/skills/04-reverse-engineering/scripts/__pycache__/binary_analyzer.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/04-reverse-engineering/scripts/binary_analyzer.py](../../.claude/skills/04-reverse-engineering/scripts/binary_analyzer.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/05-malware-analysis/SKILL.md](../../.claude/skills/05-malware-analysis/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/05-malware-analysis/examples/example_usage.md](../../.claude/skills/05-malware-analysis/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/05-malware-analysis/scripts/__pycache__/static_analyzer.cpython-314.pyc](../../.claude/skills/05-malware-analysis/scripts/__pycache__/static_analyzer.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/05-malware-analysis/scripts/__pycache__/yara_generator.cpython-314.pyc](../../.claude/skills/05-malware-analysis/scripts/__pycache__/yara_generator.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/05-malware-analysis/scripts/static_analyzer.py](../../.claude/skills/05-malware-analysis/scripts/static_analyzer.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/05-malware-analysis/scripts/yara_generator.py](../../.claude/skills/05-malware-analysis/scripts/yara_generator.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/06-threat-hunting/SKILL.md](../../.claude/skills/06-threat-hunting/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/06-threat-hunting/examples/example_usage.md](../../.claude/skills/06-threat-hunting/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/06-threat-hunting/scripts/__pycache__/ioc_extractor.cpython-314.pyc](../../.claude/skills/06-threat-hunting/scripts/__pycache__/ioc_extractor.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/06-threat-hunting/scripts/__pycache__/mitre_mapper.cpython-314.pyc](../../.claude/skills/06-threat-hunting/scripts/__pycache__/mitre_mapper.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/06-threat-hunting/scripts/ioc_extractor.py](../../.claude/skills/06-threat-hunting/scripts/ioc_extractor.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/06-threat-hunting/scripts/mitre_mapper.py](../../.claude/skills/06-threat-hunting/scripts/mitre_mapper.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/07-incident-response/SKILL.md](../../.claude/skills/07-incident-response/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/07-incident-response/examples/example_usage.md](../../.claude/skills/07-incident-response/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/07-incident-response/scripts/__pycache__/timeline_builder.cpython-314.pyc](../../.claude/skills/07-incident-response/scripts/__pycache__/timeline_builder.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/07-incident-response/scripts/evidence_collector.py](../../.claude/skills/07-incident-response/scripts/evidence_collector.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/07-incident-response/scripts/timeline_builder.py](../../.claude/skills/07-incident-response/scripts/timeline_builder.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/08-network-security/SKILL.md](../../.claude/skills/08-network-security/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/08-network-security/examples/example_usage.md](../../.claude/skills/08-network-security/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/08-network-security/scripts/__pycache__/pcap_analyzer.cpython-314.pyc](../../.claude/skills/08-network-security/scripts/__pycache__/pcap_analyzer.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/08-network-security/scripts/pcap_analyzer.py](../../.claude/skills/08-network-security/scripts/pcap_analyzer.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/09-web-security/SKILL.md](../../.claude/skills/09-web-security/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/09-web-security/examples/example_usage.md](../../.claude/skills/09-web-security/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/09-web-security/scripts/__pycache__/owasp_scanner.cpython-314.pyc](../../.claude/skills/09-web-security/scripts/__pycache__/owasp_scanner.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/09-web-security/scripts/api_security_tester.py](../../.claude/skills/09-web-security/scripts/api_security_tester.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/09-web-security/scripts/owasp_scanner.py](../../.claude/skills/09-web-security/scripts/owasp_scanner.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/10-cloud-security/SKILL.md](../../.claude/skills/10-cloud-security/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/10-cloud-security/examples/example_usage.md](../../.claude/skills/10-cloud-security/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/10-cloud-security/scripts/__pycache__/iac_scanner.cpython-314.pyc](../../.claude/skills/10-cloud-security/scripts/__pycache__/iac_scanner.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/10-cloud-security/scripts/cloud_auditor.py](../../.claude/skills/10-cloud-security/scripts/cloud_auditor.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/10-cloud-security/scripts/iac_scanner.py](../../.claude/skills/10-cloud-security/scripts/iac_scanner.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/11-csoc-automation/SKILL.md](../../.claude/skills/11-csoc-automation/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/11-csoc-automation/examples/example_usage.md](../../.claude/skills/11-csoc-automation/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/11-csoc-automation/scripts/__pycache__/alert_triager.cpython-314.pyc](../../.claude/skills/11-csoc-automation/scripts/__pycache__/alert_triager.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/11-csoc-automation/scripts/alert_triager.py](../../.claude/skills/11-csoc-automation/scripts/alert_triager.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/11-csoc-automation/scripts/report_generator.py](../../.claude/skills/11-csoc-automation/scripts/report_generator.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/12-log-analysis/SKILL.md](../../.claude/skills/12-log-analysis/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/12-log-analysis/examples/example_usage.md](../../.claude/skills/12-log-analysis/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/12-log-analysis/scripts/__pycache__/log_parser.cpython-314.pyc](../../.claude/skills/12-log-analysis/scripts/__pycache__/log_parser.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/12-log-analysis/scripts/anomaly_detector.py](../../.claude/skills/12-log-analysis/scripts/anomaly_detector.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/12-log-analysis/scripts/log_parser.py](../../.claude/skills/12-log-analysis/scripts/log_parser.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/13-crypto-analysis/SKILL.md](../../.claude/skills/13-crypto-analysis/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/13-crypto-analysis/examples/example_usage.md](../../.claude/skills/13-crypto-analysis/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/13-crypto-analysis/scripts/__pycache__/tls_auditor.cpython-314.pyc](../../.claude/skills/13-crypto-analysis/scripts/__pycache__/tls_auditor.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/13-crypto-analysis/scripts/tls_auditor.py](../../.claude/skills/13-crypto-analysis/scripts/tls_auditor.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/14-red-team-ops/SKILL.md](../../.claude/skills/14-red-team-ops/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/14-red-team-ops/examples/example_usage.md](../../.claude/skills/14-red-team-ops/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/14-red-team-ops/scripts/__pycache__/engagement_planner.cpython-314.pyc](../../.claude/skills/14-red-team-ops/scripts/__pycache__/engagement_planner.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/14-red-team-ops/scripts/engagement_planner.py](../../.claude/skills/14-red-team-ops/scripts/engagement_planner.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/15-blue-team-defense/SKILL.md](../../.claude/skills/15-blue-team-defense/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/15-blue-team-defense/examples/example_usage.md](../../.claude/skills/15-blue-team-defense/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/15-blue-team-defense/scripts/__pycache__/hardening_checker.cpython-314.pyc](../../.claude/skills/15-blue-team-defense/scripts/__pycache__/hardening_checker.cpython-314.pyc) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/15-blue-team-defense/scripts/hardening_checker.py](../../.claude/skills/15-blue-team-defense/scripts/hardening_checker.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/16-ai-llm-security/SKILL.md](../../.claude/skills/16-ai-llm-security/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/16-ai-llm-security/examples/example_usage.md](../../.claude/skills/16-ai-llm-security/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/16-ai-llm-security/scripts/model_supply_chain.py](../../.claude/skills/16-ai-llm-security/scripts/model_supply_chain.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/16-ai-llm-security/scripts/prompt_injection_tester.py](../../.claude/skills/16-ai-llm-security/scripts/prompt_injection_tester.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/17-mobile-security/SKILL.md](../../.claude/skills/17-mobile-security/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/17-mobile-security/examples/example_usage.md](../../.claude/skills/17-mobile-security/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/17-mobile-security/scripts/apk_analyzer.py](../../.claude/skills/17-mobile-security/scripts/apk_analyzer.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/18-ot-ics-security/SKILL.md](../../.claude/skills/18-ot-ics-security/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/18-ot-ics-security/examples/example_usage.md](../../.claude/skills/18-ot-ics-security/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/18-ot-ics-security/scripts/ics_protocol_analyzer.py](../../.claude/skills/18-ot-ics-security/scripts/ics_protocol_analyzer.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/19-grc-compliance/SKILL.md](../../.claude/skills/19-grc-compliance/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/19-grc-compliance/examples/example_usage.md](../../.claude/skills/19-grc-compliance/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/19-grc-compliance/scripts/control_mapper.py](../../.claude/skills/19-grc-compliance/scripts/control_mapper.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/19-grc-compliance/scripts/risk_register.py](../../.claude/skills/19-grc-compliance/scripts/risk_register.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/20-supply-chain-security/SKILL.md](../../.claude/skills/20-supply-chain-security/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/20-supply-chain-security/examples/example_usage.md](../../.claude/skills/20-supply-chain-security/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/20-supply-chain-security/scripts/supply_chain_auditor.py](../../.claude/skills/20-supply-chain-security/scripts/supply_chain_auditor.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/21-threat-intelligence/SKILL.md](../../.claude/skills/21-threat-intelligence/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/21-threat-intelligence/examples/example_usage.md](../../.claude/skills/21-threat-intelligence/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/21-threat-intelligence/scripts/cti_processor.py](../../.claude/skills/21-threat-intelligence/scripts/cti_processor.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/22-purple-team/SKILL.md](../../.claude/skills/22-purple-team/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/22-purple-team/examples/example_usage.md](../../.claude/skills/22-purple-team/examples/example_usage.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/22-purple-team/scripts/detection_validator.py](../../.claude/skills/22-purple-team/scripts/detection_validator.py) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/boy-scout/SKILL.md](../../.claude/skills/boy-scout/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/clean-comments/SKILL.md](../../.claude/skills/clean-comments/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/clean-functions/SKILL.md](../../.claude/skills/clean-functions/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/clean-general/SKILL.md](../../.claude/skills/clean-general/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/clean-names/SKILL.md](../../.claude/skills/clean-names/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/clean-tests/SKILL.md](../../.claude/skills/clean-tests/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.claude/skills/typescript-clean-code/SKILL.md](../../.claude/skills/typescript-clean-code/SKILL.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [.gitignore](../../.gitignore) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [AGENTS.md](../../AGENTS.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [CLAUDE.md](../../CLAUDE.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [Changes.md](../../Changes.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [PROGRESS_REPORT.md](../../PROGRESS_REPORT.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [README.md](../../README.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [design/PRODUCTION-BASELINE.md](../../design/PRODUCTION-BASELINE.md) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/ROUND-2-CONTEXT.md](../../design/ROUND-2-CONTEXT.md) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/STYLEGUIDE.html](../../design/STYLEGUIDE.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/01-the-key.html](../../design/landing/01-the-key.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/02-id-card.html](../../design/landing/02-id-card.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/03-legend.html](../../design/landing/03-legend.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/04-timetable.html](../../design/landing/04-timetable.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/05-midnight.html](../../design/landing/05-midnight.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/06-two-doors.html](../../design/landing/06-two-doors.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/07-ask.html](../../design/landing/07-ask.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/08-product.html](../../design/landing/08-product.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/09-poster.html](../../design/landing/09-poster.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/10-story.html](../../design/landing/10-story.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/base.css](../../design/landing/base.css) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/fonts/ApfelGrotezk-Fett.woff2](../../design/landing/fonts/ApfelGrotezk-Fett.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/fonts/ApfelGrotezk-Mittel.woff2](../../design/landing/fonts/ApfelGrotezk-Mittel.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/fonts/ApfelGrotezk-Regular.woff2](../../design/landing/fonts/ApfelGrotezk-Regular.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/fonts/ApfelGrotezk-Satt.woff2](../../design/landing/fonts/ApfelGrotezk-Satt.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/fonts/FragmentMono-Regular.woff2](../../design/landing/fonts/FragmentMono-Regular.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/index.html](../../design/landing/index.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/logos/logo-anchor.svg](../../design/landing/logos/logo-anchor.svg) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/logos/logo-color.svg](../../design/landing/logos/logo-color.svg) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/landing/logos/logo-white.svg](../../design/landing/logos/logo-white.svg) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/reference/Pasted image.png](../../design/reference/Pasted%20image.png) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/A.html](../../design/round-1/A.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/B.html](../../design/round-1/B.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/C.html](../../design/round-1/C.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/D.html](../../design/round-1/D.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/E.html](../../design/round-1/E.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/capsules/A.md](../../design/round-1/capsules/A.md) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/capsules/B.md](../../design/round-1/capsules/B.md) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/capsules/C.md](../../design/round-1/capsules/C.md) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/capsules/D.md](../../design/round-1/capsules/D.md) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/capsules/E.md](../../design/round-1/capsules/E.md) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/fonts/ApfelGrotezk-Fett.woff2](../../design/round-1/fonts/ApfelGrotezk-Fett.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/fonts/ApfelGrotezk-Mittel.woff2](../../design/round-1/fonts/ApfelGrotezk-Mittel.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/fonts/ApfelGrotezk-Regular.woff2](../../design/round-1/fonts/ApfelGrotezk-Regular.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/fonts/ApfelGrotezk-Satt.woff2](../../design/round-1/fonts/ApfelGrotezk-Satt.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/fonts/BricolageGrotesque-var.ttf](../../design/round-1/fonts/BricolageGrotesque-var.ttf) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/fonts/FragmentMono-Italic.woff2](../../design/round-1/fonts/FragmentMono-Italic.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/fonts/FragmentMono-Regular.woff2](../../design/round-1/fonts/FragmentMono-Regular.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/fonts/JetBrainsMono-Bold.woff2](../../design/round-1/fonts/JetBrainsMono-Bold.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/fonts/JetBrainsMono-Medium.woff2](../../design/round-1/fonts/JetBrainsMono-Medium.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/fonts/JetBrainsMono-Regular.woff2](../../design/round-1/fonts/JetBrainsMono-Regular.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/fonts/LeagueSpartan-Bold.woff2](../../design/round-1/fonts/LeagueSpartan-Bold.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/fonts/LeagueSpartan-Regular.woff2](../../design/round-1/fonts/LeagueSpartan-Regular.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/fonts/LeagueSpartan-var.ttf](../../design/round-1/fonts/LeagueSpartan-var.ttf) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/fonts/YoungSerif-Regular.woff2](../../design/round-1/fonts/YoungSerif-Regular.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-1/index.html](../../design/round-1/index.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-2/01-landing.html](../../design/round-2/01-landing.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-2/02-auth.html](../../design/round-2/02-auth.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-2/03-portal-dashboard.html](../../design/round-2/03-portal-dashboard.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-2/04-admin-table.html](../../design/round-2/04-admin-table.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-2/05-class-browse.html](../../design/round-2/05-class-browse.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-2/06-class-detail.html](../../design/round-2/06-class-detail.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-2/07-create-form.html](../../design/round-2/07-create-form.html) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-2/base.css](../../design/round-2/base.css) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-2/fonts/ApfelGrotezk-Fett.woff2](../../design/round-2/fonts/ApfelGrotezk-Fett.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-2/fonts/ApfelGrotezk-Mittel.woff2](../../design/round-2/fonts/ApfelGrotezk-Mittel.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-2/fonts/ApfelGrotezk-Regular.woff2](../../design/round-2/fonts/ApfelGrotezk-Regular.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-2/fonts/FragmentMono-Italic.woff2](../../design/round-2/fonts/FragmentMono-Italic.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-2/fonts/FragmentMono-Regular.woff2](../../design/round-2/fonts/FragmentMono-Regular.woff2) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [design/round-2/theme-toggle.js](../../design/round-2/theme-toggle.js) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [docs/README.md](../../docs/README.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/archive/plans/admin-portal-fixes.txt](../../docs/archive/plans/admin-portal-fixes.txt) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/archive/plans/fixes.txt](../../docs/archive/plans/fixes.txt) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/archive/plans/help-and-faq-pages.md](../../docs/archive/plans/help-and-faq-pages.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/archive/plans/leaner-portal-fixes.txt](../../docs/archive/plans/leaner-portal-fixes.txt) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/archive/plans/pre-test-post-test-plan.md](../../docs/archive/plans/pre-test-post-test-plan.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/archive/plans/sept-5-fixes.md](../../docs/archive/plans/sept-5-fixes.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/archive/plans/todo-cleanup-sprint.md](../../docs/archive/plans/todo-cleanup-sprint.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/archive/plans/todo-cleanup-sprint.totest.txt](../../docs/archive/plans/todo-cleanup-sprint.totest.txt) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/archive/plans/topic-requests-v2.md](../../docs/archive/plans/topic-requests-v2.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/archive/plans/ui-redesign-tailwind-port.md](../../docs/archive/plans/ui-redesign-tailwind-port.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/archive/reports/feature-status-and-sprint-report-2026-09-02.xlsx](../../docs/archive/reports/feature-status-and-sprint-report-2026-09-02.xlsx) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/archive/reports/feature-status-and-sprint-report-2026-09-06.xlsx](../../docs/archive/reports/feature-status-and-sprint-report-2026-09-06.xlsx) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/backlog/TODO.txt](../../docs/backlog/TODO.txt) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/backlog/TOTEST.txt](../../docs/backlog/TOTEST.txt) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/plans/README.md](../../docs/plans/README.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/plans/assessments.md](../../docs/plans/assessments.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/plans/deployment.md](../../docs/plans/deployment.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/plans/dev-data-factory.md](../../docs/plans/dev-data-factory.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/plans/fixes.md](../../docs/plans/fixes.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/plans/landing-page-redesign.md](../../docs/plans/landing-page-redesign.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/plans/notification-system-expansion.md](../../docs/plans/notification-system-expansion.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/plans/subject-topic-management.md](../../docs/plans/subject-topic-management.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/reference/architecture-design.html](../../docs/reference/architecture-design.html) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/reference/architecture-design.pdf](../../docs/reference/architecture-design.pdf) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/reference/auth-implementation.md](../../docs/reference/auth-implementation.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/reference/chatbot.md](../../docs/reference/chatbot.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/reference/decisions.md](../../docs/reference/decisions.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/reference/erd.md](../../docs/reference/erd.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/reference/erd.mmd](../../docs/reference/erd.mmd) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/reference/feature-checklist.md](../../docs/reference/feature-checklist.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/reference/project-overview.md](../../docs/reference/project-overview.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/reference/theme.md](../../docs/reference/theme.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/reference/thesis.md](../../docs/reference/thesis.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/reports/feature-status-and-sprint-report.xlsx](../../docs/reports/feature-status-and-sprint-report.xlsx) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/reviews/reviews.md](../../docs/reviews/reviews.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/roles/ADMIN.md](../../docs/roles/ADMIN.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/roles/LEARNER.md](../../docs/roles/LEARNER.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/roles/TUTOR.md](../../docs/roles/TUTOR.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/to-submit/IT124_M01_D3_System-Design-Refinement_Learning-Module_Katuwang-answered.docx](../../docs/to-submit/IT124_M01_D3_System-Design-Refinement_Learning-Module_Katuwang-answered.docx) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/to-submit/IT124_M01_D3_System-Design-Refinement_Learning-Module_v02.pdf](../../docs/to-submit/IT124_M01_D3_System-Design-Refinement_Learning-Module_v02.pdf) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/to-submit/m01-presentation/Katuwang_M01_System-Design-Refinement.pdf](../../docs/to-submit/m01-presentation/Katuwang_M01_System-Design-Refinement.pdf) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/to-submit/m01-presentation/Katuwang_M01_System-Design-Refinement.pptx](../../docs/to-submit/m01-presentation/Katuwang_M01_System-Design-Refinement.pptx) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/to-submit/m01-presentation/Katuwang_Subprocess-Tracking-Flowcharts.pptx](../../docs/to-submit/m01-presentation/Katuwang_Subprocess-Tracking-Flowcharts.pptx) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/to-submit/m01-presentation/assets/DFD.md](../../docs/to-submit/m01-presentation/assets/DFD.md) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/to-submit/m01-presentation/assets/dfd-level0.mmd](../../docs/to-submit/m01-presentation/assets/dfd-level0.mmd) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/to-submit/m01-presentation/assets/dfd-level0.png](../../docs/to-submit/m01-presentation/assets/dfd-level0.png) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/to-submit/m01-presentation/assets/dfd-level0.svg](../../docs/to-submit/m01-presentation/assets/dfd-level0.svg) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/to-submit/m01-presentation/assets/dfd-level1.mmd](../../docs/to-submit/m01-presentation/assets/dfd-level1.mmd) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/to-submit/m01-presentation/assets/dfd-level1.png](../../docs/to-submit/m01-presentation/assets/dfd-level1.png) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [docs/to-submit/m01-presentation/assets/dfd-level1.svg](../../docs/to-submit/m01-presentation/assets/dfd-level1.svg) | Existing documentation / historical reference | [Coverage](09-caveats-and-assumptions.md) |
| [eslint.config.mjs](../../eslint.config.mjs) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [next.config.ts](../../next.config.ts) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [package.json](../../package.json) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [plan.md](../../plan.md) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [pnpm-lock.yaml](../../pnpm-lock.yaml) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [pnpm-workspace.yaml](../../pnpm-workspace.yaml) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [postcss.config.mjs](../../postcss.config.mjs) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [prisma.config.ts](../../prisma.config.ts) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [prisma/SEED_ACCOUNTS.md](../../prisma/SEED_ACCOUNTS.md) | Schema / operator seeds | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260611021809_test/migration.sql](../../prisma/migrations/20260611021809_test/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260629104623_user_profile/migration.sql](../../prisma/migrations/20260629104623_user_profile/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260629104936/migration.sql](../../prisma/migrations/20260629104936/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260821064529_checkpoint_zero/migration.sql](../../prisma/migrations/20260821064529_checkpoint_zero/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260821070000_remove_teacher_moderator_role/migration.sql](../../prisma/migrations/20260821070000_remove_teacher_moderator_role/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260823020933_remove_unused_tables_normalize_availability/migration.sql](../../prisma/migrations/20260823020933_remove_unused_tables_normalize_availability/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260824104705_tutorclass_references_tutorprofile/NOTES.md](../../prisma/migrations/20260824104705_tutorclass_references_tutorprofile/NOTES.md) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260824104705_tutorclass_references_tutorprofile/migration.sql](../../prisma/migrations/20260824104705_tutorclass_references_tutorprofile/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260825185557_topic_level_certification/migration.sql](../../prisma/migrations/20260825185557_topic_level_certification/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260825195748_admin_user_class_moderation/migration.sql](../../prisma/migrations/20260825195748_admin_user_class_moderation/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260826032310_add_audit_log_and_platform_settings/migration.sql](../../prisma/migrations/20260826032310_add_audit_log_and_platform_settings/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260826064503_add_suspension_duration/migration.sql](../../prisma/migrations/20260826064503_add_suspension_duration/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260826065736_add_banned_class_status/migration.sql](../../prisma/migrations/20260826065736_add_banned_class_status/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260828041548_multisession_refactor_and_class_location/migration.sql](../../prisma/migrations/20260828041548_multisession_refactor_and_class_location/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260829043406_topic_requests_and_matching/migration.sql](../../prisma/migrations/20260829043406_topic_requests_and_matching/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260830000000_todo_cleanup_ch9_11/migration.sql](../../prisma/migrations/20260830000000_todo_cleanup_ch9_11/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260831000000_password_recovery/migration.sql](../../prisma/migrations/20260831000000_password_recovery/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260901000000_registration_approval/migration.sql](../../prisma/migrations/20260901000000_registration_approval/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260902052746_assessment_question_bank/migration.sql](../../prisma/migrations/20260902052746_assessment_question_bank/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/20260903000000_topic_requests_directed_and_notifications/migration.sql](../../prisma/migrations/20260903000000_topic_requests_directed_and_notifications/migration.sql) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/migrations/migration_lock.toml](../../prisma/migrations/migration_lock.toml) | Historical database migration | [Coverage](01-system-overview.md) |
| [prisma/schema.prisma](../../prisma/schema.prisma) | Schema / operator seeds | [Coverage](01-system-overview.md) |
| [prisma/seed-session-tests.ts](../../prisma/seed-session-tests.ts) | Schema / operator seeds | [Coverage](01-system-overview.md) |
| [prisma/seed.ts](../../prisma/seed.ts) | Schema / operator seeds | [Coverage](01-system-overview.md) |
| [prisma/seedEssentials.ts](../../prisma/seedEssentials.ts) | Schema / operator seeds | [Coverage](01-system-overview.md) |
| [public/file.svg](../../public/file.svg) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [public/globe.svg](../../public/globe.svg) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [public/logos/logo-anchor.svg](../../public/logos/logo-anchor.svg) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [public/logos/logo-dark.svg](../../public/logos/logo-dark.svg) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [public/logos/logo-full-color.svg](../../public/logos/logo-full-color.svg) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [public/logos/logo-white.svg](../../public/logos/logo-white.svg) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [public/next.svg](../../public/next.svg) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [public/vercel.svg](../../public/vercel.svg) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [public/window.svg](../../public/window.svg) | Design or static asset | [Coverage](06-shared-and-system.md) |
| [src/app/account-declined/page.tsx](../../src/app/account-declined/page.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/account-unverified/page.tsx](../../src/app/account-unverified/page.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/admin/abuse-reports/page.tsx](../../src/app/admin/abuse-reports/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/assessment/certifications/page.tsx](../../src/app/admin/assessment/certifications/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/assessment/question-bank/page.tsx](../../src/app/admin/assessment/question-bank/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/assessment/requests/page.tsx](../../src/app/admin/assessment/requests/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/assessment/results/page.tsx](../../src/app/admin/assessment/results/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/audit-log/page.tsx](../../src/app/admin/audit-log/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/certifications/page.tsx](../../src/app/admin/certifications/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/chatbot/page.tsx](../../src/app/admin/chatbot/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/class-appeals/page.tsx](../../src/app/admin/class-appeals/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/classes/[id]/page.tsx](../../src/app/admin/classes/[id]/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/classes/page.tsx](../../src/app/admin/classes/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/help/page.tsx](../../src/app/admin/help/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/layout.tsx](../../src/app/admin/layout.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/notifications/page.tsx](../../src/app/admin/notifications/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/page.tsx](../../src/app/admin/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/question-bank/page.tsx](../../src/app/admin/question-bank/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/registrations/page.tsx](../../src/app/admin/registrations/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/reports/page.tsx](../../src/app/admin/reports/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/session-tests/page.tsx](../../src/app/admin/session-tests/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/settings/page.tsx](../../src/app/admin/settings/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/subjects/page.tsx](../../src/app/admin/subjects/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/topic-requests/page.tsx](../../src/app/admin/topic-requests/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/users/[id]/page.tsx](../../src/app/admin/users/[id]/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/admin/users/page.tsx](../../src/app/admin/users/page.tsx) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/abuse-reports/[reportId]/__tests__/route.test.ts](../../src/app/api/admin/abuse-reports/[reportId]/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/abuse-reports/[reportId]/route.ts](../../src/app/api/admin/abuse-reports/[reportId]/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/abuse-reports/__tests__/route.test.ts](../../src/app/api/admin/abuse-reports/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/abuse-reports/route.ts](../../src/app/api/admin/abuse-reports/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/assessment-attempts/[attemptId]/route.ts](../../src/app/api/admin/assessment-attempts/[attemptId]/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/assessment-attempts/route.ts](../../src/app/api/admin/assessment-attempts/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/assessment-configs/__tests__/route.test.ts](../../src/app/api/admin/assessment-configs/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/assessment-configs/route.ts](../../src/app/api/admin/assessment-configs/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/assessment-questions/[questionId]/__tests__/route.test.ts](../../src/app/api/admin/assessment-questions/[questionId]/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/assessment-questions/[questionId]/route.ts](../../src/app/api/admin/assessment-questions/[questionId]/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/assessment-questions/__tests__/route.test.ts](../../src/app/api/admin/assessment-questions/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/assessment-questions/coverage/route.ts](../../src/app/api/admin/assessment-questions/coverage/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/assessment-questions/route.ts](../../src/app/api/admin/assessment-questions/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/audit-log/__tests__/route.test.ts](../../src/app/api/admin/audit-log/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/audit-log/route.ts](../../src/app/api/admin/audit-log/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/certifications/[certificationId]/__tests__/route.test.ts](../../src/app/api/admin/certifications/[certificationId]/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/certifications/[certificationId]/route.ts](../../src/app/api/admin/certifications/[certificationId]/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/certifications/__tests__/route.test.ts](../../src/app/api/admin/certifications/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/certifications/route.ts](../../src/app/api/admin/certifications/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/chatbot-misses/__tests__/route.test.ts](../../src/app/api/admin/chatbot-misses/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/chatbot-misses/route.ts](../../src/app/api/admin/chatbot-misses/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/class-appeals/[appealId]/__tests__/route.test.ts](../../src/app/api/admin/class-appeals/[appealId]/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/class-appeals/[appealId]/route.ts](../../src/app/api/admin/class-appeals/[appealId]/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/class-appeals/__tests__/route.test.ts](../../src/app/api/admin/class-appeals/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/class-appeals/route.ts](../../src/app/api/admin/class-appeals/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/classes/[classId]/__tests__/route.test.ts](../../src/app/api/admin/classes/[classId]/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/classes/[classId]/recommendations/__tests__/route.test.ts](../../src/app/api/admin/classes/[classId]/recommendations/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/classes/[classId]/recommendations/route.ts](../../src/app/api/admin/classes/[classId]/recommendations/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/classes/[classId]/route.ts](../../src/app/api/admin/classes/[classId]/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/classes/__tests__/route.test.ts](../../src/app/api/admin/classes/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/classes/route.ts](../../src/app/api/admin/classes/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/profile/password/__tests__/route.test.ts](../../src/app/api/admin/profile/password/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/profile/password/route.ts](../../src/app/api/admin/profile/password/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/question-requests/[requestId]/__tests__/route.test.ts](../../src/app/api/admin/question-requests/[requestId]/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/question-requests/[requestId]/route.ts](../../src/app/api/admin/question-requests/[requestId]/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/question-requests/route.ts](../../src/app/api/admin/question-requests/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/registrations/[userId]/__tests__/route.test.ts](../../src/app/api/admin/registrations/[userId]/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/registrations/[userId]/route.ts](../../src/app/api/admin/registrations/[userId]/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/registrations/__tests__/route.test.ts](../../src/app/api/admin/registrations/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/registrations/route.ts](../../src/app/api/admin/registrations/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/reports/__tests__/route.test.ts](../../src/app/api/admin/reports/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/reports/route.ts](../../src/app/api/admin/reports/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/session-tests/[testId]/attempts/[attemptId]/route.ts](../../src/app/api/admin/session-tests/[testId]/attempts/[attemptId]/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/session-tests/[testId]/results/route.ts](../../src/app/api/admin/session-tests/[testId]/results/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/session-tests/__tests__/route.test.ts](../../src/app/api/admin/session-tests/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/session-tests/route.ts](../../src/app/api/admin/session-tests/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/settings/__tests__/route.test.ts](../../src/app/api/admin/settings/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/settings/route.ts](../../src/app/api/admin/settings/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/subjects/[id]/__tests__/route.test.ts](../../src/app/api/admin/subjects/[id]/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/subjects/[id]/route.ts](../../src/app/api/admin/subjects/[id]/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/subjects/[id]/topics/route.ts](../../src/app/api/admin/subjects/[id]/topics/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/subjects/__tests__/route.test.ts](../../src/app/api/admin/subjects/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/subjects/route.ts](../../src/app/api/admin/subjects/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/topic-requests/[id]/__tests__/route.test.ts](../../src/app/api/admin/topic-requests/[id]/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/topic-requests/[id]/route.ts](../../src/app/api/admin/topic-requests/[id]/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/topic-requests/__tests__/route.test.ts](../../src/app/api/admin/topic-requests/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/topic-requests/route.ts](../../src/app/api/admin/topic-requests/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/topics/[id]/__tests__/route.test.ts](../../src/app/api/admin/topics/[id]/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/topics/[id]/route.ts](../../src/app/api/admin/topics/[id]/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/users/[userId]/__tests__/route.test.ts](../../src/app/api/admin/users/[userId]/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/users/[userId]/route.ts](../../src/app/api/admin/users/[userId]/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/admin/users/__tests__/route.test.ts](../../src/app/api/admin/users/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/admin/users/route.ts](../../src/app/api/admin/users/route.ts) | Admin | [Coverage](05-admin.md) |
| [src/app/api/auth/[...nextauth]/route.ts](../../src/app/api/auth/[...nextauth]/route.ts) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/app/api/auth/forgot-password/__tests__/route.test.ts](../../src/app/api/auth/forgot-password/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/auth/forgot-password/route.ts](../../src/app/api/auth/forgot-password/route.ts) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/app/api/auth/resend-verification/__tests__/route.test.ts](../../src/app/api/auth/resend-verification/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/auth/resend-verification/route.ts](../../src/app/api/auth/resend-verification/route.ts) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/app/api/auth/reset-password/__tests__/route.test.ts](../../src/app/api/auth/reset-password/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/auth/reset-password/route.ts](../../src/app/api/auth/reset-password/route.ts) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/app/api/auth/verify-email/__tests__/route.test.ts](../../src/app/api/auth/verify-email/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/auth/verify-email/route.ts](../../src/app/api/auth/verify-email/route.ts) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/app/api/chatbot/__tests__/route.test.ts](../../src/app/api/chatbot/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/chatbot/route.ts](../../src/app/api/chatbot/route.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/api/classes/[classId]/enroll/__tests__/route.test.ts](../../src/app/api/classes/[classId]/enroll/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/classes/[classId]/enroll/route.ts](../../src/app/api/classes/[classId]/enroll/route.ts) | Learner | [Coverage](03-student-learner.md) |
| [src/app/api/classes/__tests__/route.test.ts](../../src/app/api/classes/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/classes/route.ts](../../src/app/api/classes/route.ts) | Learner | [Coverage](03-student-learner.md) |
| [src/app/api/dev/route.ts](../../src/app/api/dev/route.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/api/learner/classes/[classId]/session-tests/__tests__/route.test.ts](../../src/app/api/learner/classes/[classId]/session-tests/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/learner/classes/[classId]/session-tests/route.ts](../../src/app/api/learner/classes/[classId]/session-tests/route.ts) | Learner | [Coverage](03-student-learner.md) |
| [src/app/api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start/__tests__/route.test.ts](../../src/app/api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start/route.ts](../../src/app/api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start/route.ts) | Learner | [Coverage](03-student-learner.md) |
| [src/app/api/learner/match/__tests__/route.test.ts](../../src/app/api/learner/match/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/learner/match/route.ts](../../src/app/api/learner/match/route.ts) | Learner | [Coverage](03-student-learner.md) |
| [src/app/api/learner/profile/__tests__/route.test.ts](../../src/app/api/learner/profile/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/learner/profile/password/__tests__/route.test.ts](../../src/app/api/learner/profile/password/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/learner/profile/password/route.ts](../../src/app/api/learner/profile/password/route.ts) | Learner | [Coverage](03-student-learner.md) |
| [src/app/api/learner/profile/route.ts](../../src/app/api/learner/profile/route.ts) | Learner | [Coverage](03-student-learner.md) |
| [src/app/api/learner/progress/__tests__/route.test.ts](../../src/app/api/learner/progress/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/learner/progress/route.ts](../../src/app/api/learner/progress/route.ts) | Learner | [Coverage](03-student-learner.md) |
| [src/app/api/learner/reports/__tests__/route.test.ts](../../src/app/api/learner/reports/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/learner/reports/route.ts](../../src/app/api/learner/reports/route.ts) | Learner | [Coverage](03-student-learner.md) |
| [src/app/api/learner/session-test-attempts/[attemptId]/route.ts](../../src/app/api/learner/session-test-attempts/[attemptId]/route.ts) | Learner | [Coverage](03-student-learner.md) |
| [src/app/api/learner/session-test-attempts/[attemptId]/submit/__tests__/route.test.ts](../../src/app/api/learner/session-test-attempts/[attemptId]/submit/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/learner/session-test-attempts/[attemptId]/submit/route.ts](../../src/app/api/learner/session-test-attempts/[attemptId]/submit/route.ts) | Learner | [Coverage](03-student-learner.md) |
| [src/app/api/learner/topic-requests/[id]/__tests__/route.test.ts](../../src/app/api/learner/topic-requests/[id]/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/learner/topic-requests/[id]/route.ts](../../src/app/api/learner/topic-requests/[id]/route.ts) | Learner | [Coverage](03-student-learner.md) |
| [src/app/api/learner/topic-requests/__tests__/route.test.ts](../../src/app/api/learner/topic-requests/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/learner/topic-requests/route.ts](../../src/app/api/learner/topic-requests/route.ts) | Learner | [Coverage](03-student-learner.md) |
| [src/app/api/learner/tutors/__tests__/route.test.ts](../../src/app/api/learner/tutors/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/learner/tutors/route.ts](../../src/app/api/learner/tutors/route.ts) | Learner | [Coverage](03-student-learner.md) |
| [src/app/api/notifications/__tests__/route.test.ts](../../src/app/api/notifications/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/notifications/read/__tests__/route.test.ts](../../src/app/api/notifications/read/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/notifications/read/route.ts](../../src/app/api/notifications/read/route.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/api/notifications/route.ts](../../src/app/api/notifications/route.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/api/register/__tests__/route.test.ts](../../src/app/api/register/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/register/route.ts](../../src/app/api/register/route.ts) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/app/api/search/__tests__/route.test.ts](../../src/app/api/search/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/search/route.ts](../../src/app/api/search/route.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/api/subjects/route.ts](../../src/app/api/subjects/route.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/api/tutor/assessments/[attemptId]/route.ts](../../src/app/api/tutor/assessments/[attemptId]/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/assessments/[attemptId]/submit/__tests__/route.test.ts](../../src/app/api/tutor/assessments/[attemptId]/submit/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/assessments/[attemptId]/submit/route.ts](../../src/app/api/tutor/assessments/[attemptId]/submit/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/assessments/__tests__/route.test.ts](../../src/app/api/tutor/assessments/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/assessments/route.ts](../../src/app/api/tutor/assessments/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/classes/[classId]/__tests__/route.test.ts](../../src/app/api/tutor/classes/[classId]/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/classes/[classId]/appeal/__tests__/route.test.ts](../../src/app/api/tutor/classes/[classId]/appeal/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/classes/[classId]/appeal/route.ts](../../src/app/api/tutor/classes/[classId]/appeal/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/classes/[classId]/route.ts](../../src/app/api/tutor/classes/[classId]/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/classes/[classId]/sessions/[sessionId]/__tests__/route.test.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/classes/[classId]/sessions/[sessionId]/route.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/__tests__/route.test.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]/__tests__/route.test.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]/route.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/questions/__tests__/route.test.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/questions/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/questions/route.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/questions/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/results/__tests__/route.test.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/results/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/results/route.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/results/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/route.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/status/__tests__/route.test.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/status/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/status/route.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/status/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/classes/[classId]/sessions/__tests__/route.test.ts](../../src/app/api/tutor/classes/[classId]/sessions/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/classes/[classId]/sessions/route.ts](../../src/app/api/tutor/classes/[classId]/sessions/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/classes/[classId]/test-results/__tests__/route.test.ts](../../src/app/api/tutor/classes/[classId]/test-results/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/classes/[classId]/test-results/route.ts](../../src/app/api/tutor/classes/[classId]/test-results/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/classes/__tests__/route.test.ts](../../src/app/api/tutor/classes/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/classes/route.ts](../../src/app/api/tutor/classes/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/profile/__tests__/route.test.ts](../../src/app/api/tutor/profile/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/profile/password/__tests__/route.test.ts](../../src/app/api/tutor/profile/password/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/profile/password/route.ts](../../src/app/api/tutor/profile/password/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/profile/route.ts](../../src/app/api/tutor/profile/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/question-bank/__tests__/route.test.ts](../../src/app/api/tutor/question-bank/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/question-bank/route.ts](../../src/app/api/tutor/question-bank/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/question-requests/route.ts](../../src/app/api/tutor/question-requests/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/questions/[questionId]/route.ts](../../src/app/api/tutor/questions/[questionId]/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/questions/__tests__/route.test.ts](../../src/app/api/tutor/questions/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/questions/route.ts](../../src/app/api/tutor/questions/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/students/__tests__/route.test.ts](../../src/app/api/tutor/students/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/students/route.ts](../../src/app/api/tutor/students/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/topic-certifications/__tests__/route.test.ts](../../src/app/api/tutor/topic-certifications/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/topic-certifications/route.ts](../../src/app/api/tutor/topic-certifications/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/topic-requests/[id]/accept/__tests__/route.test.ts](../../src/app/api/tutor/topic-requests/[id]/accept/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/topic-requests/[id]/accept/route.ts](../../src/app/api/tutor/topic-requests/[id]/accept/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/api/tutor/topic-requests/__tests__/route.test.ts](../../src/app/api/tutor/topic-requests/__tests__/route.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/app/api/tutor/topic-requests/route.ts](../../src/app/api/tutor/topic-requests/route.ts) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/dashboard/page.tsx](../../src/app/dashboard/page.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/dev/charts/page.tsx](../../src/app/dev/charts/page.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/dev/login/page.tsx](../../src/app/dev/login/page.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/dev/page.tsx](../../src/app/dev/page.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/favicon.ico](../../src/app/favicon.ico) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/fonts/ApfelGrotezk-Fett.woff2](../../src/app/fonts/ApfelGrotezk-Fett.woff2) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/fonts/ApfelGrotezk-Mittel.woff2](../../src/app/fonts/ApfelGrotezk-Mittel.woff2) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/fonts/ApfelGrotezk-Regular.woff2](../../src/app/fonts/ApfelGrotezk-Regular.woff2) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/fonts/ApfelGrotezk-Satt.woff2](../../src/app/fonts/ApfelGrotezk-Satt.woff2) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/fonts/FragmentMono-Italic.woff2](../../src/app/fonts/FragmentMono-Italic.woff2) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/fonts/FragmentMono-Regular.woff2](../../src/app/fonts/FragmentMono-Regular.woff2) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/forgot-password/page.tsx](../../src/app/forgot-password/page.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/globals.css](../../src/app/globals.css) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/layout.tsx](../../src/app/layout.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/learner/classes/[classId]/page.tsx](../../src/app/learner/classes/[classId]/page.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/app/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/page.tsx](../../src/app/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/page.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/app/learner/classes/page.tsx](../../src/app/learner/classes/page.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/app/learner/help/page.tsx](../../src/app/learner/help/page.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/app/learner/layout.tsx](../../src/app/learner/layout.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/app/learner/match/page.tsx](../../src/app/learner/match/page.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/app/learner/my-classes/page.tsx](../../src/app/learner/my-classes/page.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/app/learner/notifications/page.tsx](../../src/app/learner/notifications/page.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/app/learner/page.tsx](../../src/app/learner/page.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/app/learner/profile/edit/page.tsx](../../src/app/learner/profile/edit/page.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/app/learner/profile/page.tsx](../../src/app/learner/profile/page.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/app/learner/progress/page.tsx](../../src/app/learner/progress/page.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/app/learner/reports/page.tsx](../../src/app/learner/reports/page.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/app/learner/requests/page.tsx](../../src/app/learner/requests/page.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/app/learner/tutors/[tutorId]/page.tsx](../../src/app/learner/tutors/[tutorId]/page.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/app/learner/tutors/page.tsx](../../src/app/learner/tutors/page.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/app/login/page.tsx](../../src/app/login/page.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/logout/page.tsx](../../src/app/logout/page.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/page.tsx](../../src/app/page.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/pending-approval/page.tsx](../../src/app/pending-approval/page.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/privacy-policy/page.tsx](../../src/app/privacy-policy/page.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/register/learner/page.tsx](../../src/app/register/learner/page.tsx) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/app/register/page.tsx](../../src/app/register/page.tsx) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/app/register/tutor/page.tsx](../../src/app/register/tutor/page.tsx) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/app/reset-password/page.tsx](../../src/app/reset-password/page.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/tutor/assessments/[attemptId]/page.tsx](../../src/app/tutor/assessments/[attemptId]/page.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/tutor/assessments/page.tsx](../../src/app/tutor/assessments/page.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/tutor/classes/[classId]/edit/page.tsx](../../src/app/tutor/classes/[classId]/edit/page.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/tutor/classes/[classId]/page.tsx](../../src/app/tutor/classes/[classId]/page.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/tutor/classes/[classId]/sessions/[sessionId]/test/page.tsx](../../src/app/tutor/classes/[classId]/sessions/[sessionId]/test/page.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/tutor/classes/[classId]/sessions/[sessionId]/test/results/page.tsx](../../src/app/tutor/classes/[classId]/sessions/[sessionId]/test/results/page.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/tutor/classes/new/page.tsx](../../src/app/tutor/classes/new/page.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/tutor/classes/page.tsx](../../src/app/tutor/classes/page.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/tutor/help/page.tsx](../../src/app/tutor/help/page.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/tutor/layout.tsx](../../src/app/tutor/layout.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/tutor/notifications/page.tsx](../../src/app/tutor/notifications/page.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/tutor/page.tsx](../../src/app/tutor/page.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/tutor/profile/edit/page.tsx](../../src/app/tutor/profile/edit/page.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/tutor/profile/page.tsx](../../src/app/tutor/profile/page.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/tutor/requests/[id]/accept/page.tsx](../../src/app/tutor/requests/[id]/accept/page.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/tutor/requests/page.tsx](../../src/app/tutor/requests/page.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/tutor/students/[studentId]/page.tsx](../../src/app/tutor/students/[studentId]/page.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/tutor/students/page.tsx](../../src/app/tutor/students/page.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/app/unauthorized/page.tsx](../../src/app/unauthorized/page.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/verify-email/check-email/page.tsx](../../src/app/verify-email/check-email/page.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/app/verify-email/page.tsx](../../src/app/verify-email/page.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/admin/AbuseReportTable.tsx](../../src/components/admin/AbuseReportTable.tsx) | Admin | [Coverage](05-admin.md) |
| [src/components/admin/AuditLogTable.tsx](../../src/components/admin/AuditLogTable.tsx) | Admin | [Coverage](05-admin.md) |
| [src/components/admin/CertificationReviewTable.tsx](../../src/components/admin/CertificationReviewTable.tsx) | Admin | [Coverage](05-admin.md) |
| [src/components/admin/ChatbotMissesTable.tsx](../../src/components/admin/ChatbotMissesTable.tsx) | Admin | [Coverage](05-admin.md) |
| [src/components/admin/ClassAppealTable.tsx](../../src/components/admin/ClassAppealTable.tsx) | Admin | [Coverage](05-admin.md) |
| [src/components/admin/ClassModerationTable.tsx](../../src/components/admin/ClassModerationTable.tsx) | Admin | [Coverage](05-admin.md) |
| [src/components/admin/PlatformSettingsForm.tsx](../../src/components/admin/PlatformSettingsForm.tsx) | Admin | [Coverage](05-admin.md) |
| [src/components/admin/QuestionBankManager.tsx](../../src/components/admin/QuestionBankManager.tsx) | Admin | [Coverage](05-admin.md) |
| [src/components/admin/RegistrationApprovalTable.tsx](../../src/components/admin/RegistrationApprovalTable.tsx) | Admin | [Coverage](05-admin.md) |
| [src/components/admin/ReportsView.tsx](../../src/components/admin/ReportsView.tsx) | Admin | [Coverage](05-admin.md) |
| [src/components/admin/SessionTestsTable.tsx](../../src/components/admin/SessionTestsTable.tsx) | Admin | [Coverage](05-admin.md) |
| [src/components/admin/SubjectTopicManager.tsx](../../src/components/admin/SubjectTopicManager.tsx) | Admin | [Coverage](05-admin.md) |
| [src/components/admin/TopicRequestModerationTable.tsx](../../src/components/admin/TopicRequestModerationTable.tsx) | Admin | [Coverage](05-admin.md) |
| [src/components/admin/UserManagementTable.tsx](../../src/components/admin/UserManagementTable.tsx) | Admin | [Coverage](05-admin.md) |
| [src/components/auth/AuthLayout.tsx](../../src/components/auth/AuthLayout.tsx) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/components/auth/ForgotPasswordForm.tsx](../../src/components/auth/ForgotPasswordForm.tsx) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/components/auth/LoginForm.tsx](../../src/components/auth/LoginForm.tsx) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/components/auth/LogoutConfirm.tsx](../../src/components/auth/LogoutConfirm.tsx) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/components/auth/RegisterForm.tsx](../../src/components/auth/RegisterForm.tsx) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/components/auth/ResendVerificationButton.tsx](../../src/components/auth/ResendVerificationButton.tsx) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/components/auth/ResetPasswordForm.tsx](../../src/components/auth/ResetPasswordForm.tsx) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/components/auth/VerifyEmailForm.tsx](../../src/components/auth/VerifyEmailForm.tsx) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/components/charts/BarChartCard.tsx](../../src/components/charts/BarChartCard.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/charts/DataTable.tsx](../../src/components/charts/DataTable.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/charts/DeltaBar.tsx](../../src/components/charts/DeltaBar.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/charts/GroupedBarChart.tsx](../../src/components/charts/GroupedBarChart.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/charts/ProgressAreaChart.tsx](../../src/components/charts/ProgressAreaChart.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/charts/RateBarChart.tsx](../../src/components/charts/RateBarChart.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/charts/__tests__/progressTooltip.test.ts](../../src/components/charts/__tests__/progressTooltip.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/components/charts/index.ts](../../src/components/charts/index.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/charts/progressTooltip.ts](../../src/components/charts/progressTooltip.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/charts/useThemeColors.ts](../../src/components/charts/useThemeColors.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/chatbot/ChatMessage.tsx](../../src/components/chatbot/ChatMessage.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/chatbot/ChatWidget.tsx](../../src/components/chatbot/ChatWidget.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/chatbot/chatbotClient.ts](../../src/components/chatbot/chatbotClient.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/classes/ClassCard.tsx](../../src/components/classes/ClassCard.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/classes/ClassDetailsView.tsx](../../src/components/classes/ClassDetailsView.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/classes/ClassEmptyState.tsx](../../src/components/classes/ClassEmptyState.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/classes/ClassModerationPanel.tsx](../../src/components/classes/ClassModerationPanel.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/classes/EnrolledLearnersTable.tsx](../../src/components/classes/EnrolledLearnersTable.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/classes/RecommendClassForm.tsx](../../src/components/classes/RecommendClassForm.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/classes/SessionTestsCard.tsx](../../src/components/classes/SessionTestsCard.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/classes/SessionsList.tsx](../../src/components/classes/SessionsList.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/classes/classStatus.ts](../../src/components/classes/classStatus.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/dev/DevChartLab.tsx](../../src/components/dev/DevChartLab.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/dev/DevDataFactory.tsx](../../src/components/dev/DevDataFactory.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/dev/DevLoginBoard.tsx](../../src/components/dev/DevLoginBoard.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/help/HelpCenter.tsx](../../src/components/help/HelpCenter.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/landing/LandingFooter.tsx](../../src/components/landing/LandingFooter.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/landing/LandingHero.tsx](../../src/components/landing/LandingHero.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/landing/LandingNav.tsx](../../src/components/landing/LandingNav.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/landing/Logo.tsx](../../src/components/landing/Logo.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/landing/MatchResultSample.tsx](../../src/components/landing/MatchResultSample.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/landing/PrivacyPayoff.tsx](../../src/components/landing/PrivacyPayoff.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/landing/SampleMatchForm.tsx](../../src/components/landing/SampleMatchForm.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/landing/SampleProgress.tsx](../../src/components/landing/SampleProgress.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/landing/StoryEnd.tsx](../../src/components/landing/StoryEnd.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/landing/StoryTimeline.tsx](../../src/components/landing/StoryTimeline.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/landing/TutorProfileSample.tsx](../../src/components/landing/TutorProfileSample.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/landing/sampleData.ts](../../src/components/landing/sampleData.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/layout/GlobalSearch.tsx](../../src/components/layout/GlobalSearch.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/layout/PortalLayout.tsx](../../src/components/layout/PortalLayout.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/learner/ClassBrowser.tsx](../../src/components/learner/ClassBrowser.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/components/learner/LearnerClassActions.tsx](../../src/components/learner/LearnerClassActions.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/components/learner/MatchCriteriaFields.tsx](../../src/components/learner/MatchCriteriaFields.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/components/learner/MatchFinder.tsx](../../src/components/learner/MatchFinder.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/components/learner/MyProgressView.tsx](../../src/components/learner/MyProgressView.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/components/learner/MyReportsList.tsx](../../src/components/learner/MyReportsList.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/components/learner/ReportButton.tsx](../../src/components/learner/ReportButton.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/components/learner/RequestTopicButton.tsx](../../src/components/learner/RequestTopicButton.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/components/learner/TopicRequestManager.tsx](../../src/components/learner/TopicRequestManager.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/components/learner/TutorBrowser.tsx](../../src/components/learner/TutorBrowser.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/components/learner/TutorInfoTrigger.tsx](../../src/components/learner/TutorInfoTrigger.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/components/learner/TutorProfileClassTabs.tsx](../../src/components/learner/TutorProfileClassTabs.tsx) | Learner | [Coverage](03-student-learner.md) |
| [src/components/notifications/NotificationBell.tsx](../../src/components/notifications/NotificationBell.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/notifications/NotificationList.tsx](../../src/components/notifications/NotificationList.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/notifications/notificationMeta.tsx](../../src/components/notifications/notificationMeta.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/profile/ChangePasswordForm.tsx](../../src/components/profile/ChangePasswordForm.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/profile/ProfileEditForm.tsx](../../src/components/profile/ProfileEditForm.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/profile/ProfileEditView.tsx](../../src/components/profile/ProfileEditView.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/profile/ProfileView.tsx](../../src/components/profile/ProfileView.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/providers/SessionProvider.tsx](../../src/components/providers/SessionProvider.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/quiz/QuestionFormModal.tsx](../../src/components/quiz/QuestionFormModal.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/quiz/SessionTestRunner.tsx](../../src/components/quiz/SessionTestRunner.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/schedule/WeeklyTimetable.tsx](../../src/components/schedule/WeeklyTimetable.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/tutor/AcceptRequestForm.tsx](../../src/components/tutor/AcceptRequestForm.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/AddSessionModal.tsx](../../src/components/tutor/AddSessionModal.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/AssessmentHistory.tsx](../../src/components/tutor/AssessmentHistory.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/AssessmentQuizRunner.tsx](../../src/components/tutor/AssessmentQuizRunner.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/AssessmentsSummaryCard.tsx](../../src/components/tutor/AssessmentsSummaryCard.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/AssessmentsTabs.tsx](../../src/components/tutor/AssessmentsTabs.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/ClassAppealCard.tsx](../../src/components/tutor/ClassAppealCard.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/ClassManageMenu.tsx](../../src/components/tutor/ClassManageMenu.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/ClassManagement.tsx](../../src/components/tutor/ClassManagement.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/ClassProgressPanel.tsx](../../src/components/tutor/ClassProgressPanel.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/ClassScheduleFields.tsx](../../src/components/tutor/ClassScheduleFields.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/EditClassForm.tsx](../../src/components/tutor/EditClassForm.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/NewClassForm.tsx](../../src/components/tutor/NewClassForm.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/OtherTopicAssessment.tsx](../../src/components/tutor/OtherTopicAssessment.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/SessionActions.tsx](../../src/components/tutor/SessionActions.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/SessionTestBuilder.tsx](../../src/components/tutor/SessionTestBuilder.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/SessionTestResults.tsx](../../src/components/tutor/SessionTestResults.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/StudentRoster.tsx](../../src/components/tutor/StudentRoster.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/TopicCertificationList.tsx](../../src/components/tutor/TopicCertificationList.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/TopicRequestBrowser.tsx](../../src/components/tutor/TopicRequestBrowser.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/tutor/WeeklyScheduleView.tsx](../../src/components/tutor/WeeklyScheduleView.tsx) | Tutor | [Coverage](04-student-tutor.md) |
| [src/components/ui/AnonymousIdBadge.tsx](../../src/components/ui/AnonymousIdBadge.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/AuditLogLink.tsx](../../src/components/ui/AuditLogLink.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/BackLink.tsx](../../src/components/ui/BackLink.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/BrandMark.tsx](../../src/components/ui/BrandMark.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/CharCount.tsx](../../src/components/ui/CharCount.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/ConfirmDialog.tsx](../../src/components/ui/ConfirmDialog.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/EmptyState.tsx](../../src/components/ui/EmptyState.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/FeedbackBanner.tsx](../../src/components/ui/FeedbackBanner.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/FormField.tsx](../../src/components/ui/FormField.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/LoadingRow.tsx](../../src/components/ui/LoadingRow.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/Modal.tsx](../../src/components/ui/Modal.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/PageHeader.tsx](../../src/components/ui/PageHeader.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/Pagination.tsx](../../src/components/ui/Pagination.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/PromptDialog.tsx](../../src/components/ui/PromptDialog.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/SearchInput.tsx](../../src/components/ui/SearchInput.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/SortableTh.tsx](../../src/components/ui/SortableTh.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/StatCard.tsx](../../src/components/ui/StatCard.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/StatusBadge.tsx](../../src/components/ui/StatusBadge.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/Tabs.tsx](../../src/components/ui/Tabs.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/components/ui/TopicChip.tsx](../../src/components/ui/TopicChip.tsx) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/hooks/useFetchList.ts](../../src/hooks/useFetchList.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/hooks/usePaginatedList.ts](../../src/hooks/usePaginatedList.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/hooks/useSubjectCatalog.ts](../../src/hooks/useSubjectCatalog.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/hooks/useTableSort.ts](../../src/hooks/useTableSort.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/hooks/useTopicCertifications.ts](../../src/hooks/useTopicCertifications.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/__tests__/assessmentConfig.test.ts](../../src/lib/__tests__/assessmentConfig.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/assessmentPicker.test.ts](../../src/lib/__tests__/assessmentPicker.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/auth.test.ts](../../src/lib/__tests__/auth.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/browseRanking.test.ts](../../src/lib/__tests__/browseRanking.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/classQueries.test.ts](../../src/lib/__tests__/classQueries.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/contactInfo.test.ts](../../src/lib/__tests__/contactInfo.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/csv.test.ts](../../src/lib/__tests__/csv.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/derivedAvailability.test.ts](../../src/lib/__tests__/derivedAvailability.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/gradeAttempt.test.ts](../../src/lib/__tests__/gradeAttempt.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/idGenerator.test.ts](../../src/lib/__tests__/idGenerator.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/mail.test.ts](../../src/lib/__tests__/mail.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/matching.test.ts](../../src/lib/__tests__/matching.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/moderation.test.ts](../../src/lib/__tests__/moderation.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/rateLimit.test.ts](../../src/lib/__tests__/rateLimit.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/sessionTestAccess.test.ts](../../src/lib/__tests__/sessionTestAccess.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/sessionTestResults.test.ts](../../src/lib/__tests__/sessionTestResults.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/sessionTestSerialize.test.ts](../../src/lib/__tests__/sessionTestSerialize.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/subjectTopics.test.ts](../../src/lib/__tests__/subjectTopics.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/__tests__/subjects.test.ts](../../src/lib/__tests__/subjects.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/assessmentConfig.ts](../../src/lib/assessmentConfig.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/assessmentPicker.ts](../../src/lib/assessmentPicker.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/assessmentSerialize.ts](../../src/lib/assessmentSerialize.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/assessmentStatus.ts](../../src/lib/assessmentStatus.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/auditLog.ts](../../src/lib/auditLog.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/auth.ts](../../src/lib/auth.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/browseRanking.ts](../../src/lib/browseRanking.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/changePassword.ts](../../src/lib/changePassword.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/chatbot/__tests__/classifier.test.ts](../../src/lib/chatbot/__tests__/classifier.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/chatbot/__tests__/faq.test.ts](../../src/lib/chatbot/__tests__/faq.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/chatbot/__tests__/misses.test.ts](../../src/lib/chatbot/__tests__/misses.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/chatbot/__tests__/normalize.test.ts](../../src/lib/chatbot/__tests__/normalize.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/chatbot/__tests__/recommend.test.ts](../../src/lib/chatbot/__tests__/recommend.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/chatbot/classifier.ts](../../src/lib/chatbot/classifier.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/chatbot/faq.ts](../../src/lib/chatbot/faq.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/chatbot/intents.ts](../../src/lib/chatbot/intents.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/chatbot/misses.ts](../../src/lib/chatbot/misses.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/chatbot/normalize.ts](../../src/lib/chatbot/normalize.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/chatbot/recommend.ts](../../src/lib/chatbot/recommend.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/chatbot/respond.ts](../../src/lib/chatbot/respond.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/chatbot/types.ts](../../src/lib/chatbot/types.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/classBrowserCache.ts](../../src/lib/classBrowserCache.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/classQueries.ts](../../src/lib/classQueries.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/classSessions.ts](../../src/lib/classSessions.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/clientStorage.ts](../../src/lib/clientStorage.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/contactInfo.ts](../../src/lib/contactInfo.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/csv.ts](../../src/lib/csv.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/datetime.ts](../../src/lib/datetime.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/derivedAvailability.ts](../../src/lib/derivedAvailability.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/emailVerification.ts](../../src/lib/emailVerification.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/gradeAttempt.ts](../../src/lib/gradeAttempt.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/gradeLevels.ts](../../src/lib/gradeLevels.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/help/helpContent.ts](../../src/lib/help/helpContent.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/idGenerator.ts](../../src/lib/idGenerator.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/mail.ts](../../src/lib/mail.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/matching.ts](../../src/lib/matching.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/moderation.ts](../../src/lib/moderation.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/notifications.ts](../../src/lib/notifications.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/pagination.ts](../../src/lib/pagination.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/passwordReset.ts](../../src/lib/passwordReset.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/portalPaths.ts](../../src/lib/portalPaths.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/prisma.ts](../../src/lib/prisma.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/rateLimit.ts](../../src/lib/rateLimit.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/registration.ts](../../src/lib/registration.ts) | Identity and public access | [Coverage](02-guest-and-applicant.md) |
| [src/lib/reportViolations.ts](../../src/lib/reportViolations.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/sessionTestAccess.ts](../../src/lib/sessionTestAccess.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/sessionTestResults.ts](../../src/lib/sessionTestResults.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/sessionTestSerialize.ts](../../src/lib/sessionTestSerialize.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/settings.ts](../../src/lib/settings.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/sortParams.ts](../../src/lib/sortParams.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/subjectTopics.ts](../../src/lib/subjectTopics.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/subjects.ts](../../src/lib/subjects.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/topicRequestVisibility.ts](../../src/lib/topicRequestVisibility.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/__tests__/auth.test.ts](../../src/lib/validations/__tests__/auth.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/validations/__tests__/class.test.ts](../../src/lib/validations/__tests__/class.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/validations/__tests__/report.test.ts](../../src/lib/validations/__tests__/report.test.ts) | Tests | [Coverage](09-caveats-and-assumptions.md) |
| [src/lib/validations/admin.ts](../../src/lib/validations/admin.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/assessment.ts](../../src/lib/validations/assessment.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/auth.ts](../../src/lib/validations/auth.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/availability.ts](../../src/lib/validations/availability.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/changePassword.ts](../../src/lib/validations/changePassword.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/chatbot.ts](../../src/lib/validations/chatbot.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/class.ts](../../src/lib/validations/class.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/classAppeal.ts](../../src/lib/validations/classAppeal.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/classRecommendation.ts](../../src/lib/validations/classRecommendation.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/emailVerification.ts](../../src/lib/validations/emailVerification.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/match.ts](../../src/lib/validations/match.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/password.ts](../../src/lib/validations/password.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/passwordReset.ts](../../src/lib/validations/passwordReset.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/profile.ts](../../src/lib/validations/profile.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/report.ts](../../src/lib/validations/report.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/sessionTest.ts](../../src/lib/validations/sessionTest.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/subject.ts](../../src/lib/validations/subject.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/lib/validations/topicCertification.ts](../../src/lib/validations/topicCertification.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/proxy.ts](../../src/proxy.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [src/types/next-auth.d.ts](../../src/types/next-auth.d.ts) | Shared source / UI / assets | [Coverage](06-shared-and-system.md) |
| [tsconfig.json](../../tsconfig.json) | Project configuration / root reference | [Coverage](01-system-overview.md) |
| [vitest.config.ts](../../vitest.config.ts) | Project configuration / root reference | [Coverage](01-system-overview.md) |

## Existing test contract inventory

These are the test titles present in the source at review time. They are evidence of intended edge cases, not a statement that the suite was executed for this documentation change.

### [route.test.ts](../../src/app/api/admin/abuse-reports/[reportId]/__tests__/route.test.ts)

PATCH /api/admin/abuse-reports/[reportId]; 401 for a non-admin; 404 when the report is missing; 400 when the report is already reviewed; 400 on an invalid decision; RESOLVE records the decision, writes an audit row and notifies the reporter; DISMISS records a dismissal.

### [route.test.ts](../../src/app/api/admin/abuse-reports/__tests__/route.test.ts)

GET /api/admin/abuse-reports; 401 for a non-admin; defaults to the PENDING tab and returns a paginated envelope; filters by the requested status; filters by target type when given; ignores an unknown target type.

### [route.test.ts](../../src/app/api/admin/assessment-configs/__tests__/route.test.ts)

/api/admin/assessment-configs (global); GET 401 for a non-admin; GET returns the resolved config; PATCH 401 for a non-admin; PATCH 400 when passPercent is out of range; PATCH 400 when no field is provided; PATCH upserts only the provided keys and writes an audit row.

### [route.test.ts](../../src/app/api/admin/assessment-questions/[questionId]/__tests__/route.test.ts)

PATCH /api/admin/assessment-questions/[questionId]; 409 when trying to edit content of an in-use question; allows toggling `active` on an in-use question and audits a retire; replaces options when editing a fresh question; DELETE /api/admin/assessment-questions/[questionId]; 409 when the question has been used; deletes an unused question and audits it.

### [route.test.ts](../../src/app/api/admin/assessment-questions/__tests__/route.test.ts)

GET /api/admin/assessment-questions; 401 for a non-admin; returns rows with an inUse flag derived from the attemptItems count; never lists tutor-authored questions — the query is scoped to origin BANK; POST /api/admin/assessment-questions; 401 for a non-admin; 400 when not exactly one option is correct; 400 when the topic is not valid for the subject; 201 creates the question with ordered options and writes an audit row; 500 when the create throws.

### [route.test.ts](../../src/app/api/admin/audit-log/__tests__/route.test.ts)

GET /api/admin/audit-log; returns 401 when unauthenticated; returns 401 when the session user is not an admin; returns a paginated payload ordered by newest first by default; applies action / targetType / q filters and a sortable column; ignores an unknown sort column, falling back to createdAt.

### [route.test.ts](../../src/app/api/admin/certifications/[certificationId]/__tests__/route.test.ts)

PATCH /api/admin/certifications/[certificationId]; returns 401 when unauthenticated; returns 404 when the certification doesn; returns 400 when the certification is no longer pending; returns 400 for an invalid decision; certifies a pending request and sets certifiedAt; rejects a pending request by setting status REJECTED with reviewedAt and note; rejects with a null note when none is supplied.

### [route.test.ts](../../src/app/api/admin/certifications/__tests__/route.test.ts)

GET /api/admin/certifications; returns 401 when unauthenticated; returns 401 when the session user is not an admin; returns a paginated payload with tutor identity flattened (defaults to PENDING); lists REJECTED certifications ordered by review date; filters by status=CERTIFIED, subject and q.

### [route.test.ts](../../src/app/api/admin/chatbot-misses/__tests__/route.test.ts)

GET /api/admin/chatbot-misses; returns 401 when unauthenticated; returns 401 when the session user is not an admin; groups near-identical rows and returns a paginated payload; applies a role filter; sorts by count; paginates the grouped results.

### [route.test.ts](../../src/app/api/admin/class-appeals/[appealId]/__tests__/route.test.ts)

PATCH /api/admin/class-appeals/[appealId]; 401 for a non-admin; 404 when the appeal is missing; 400 when the appeal is not pending; 400 on an invalid decision; APPROVE reinstates the class and notifies the tutor; REJECT records the decision and notifies without touching the class.

### [route.test.ts](../../src/app/api/admin/class-appeals/__tests__/route.test.ts)

GET /api/admin/class-appeals; 401 for a non-admin; defaults to PENDING and shapes the tutor field; honours the status query param.

### [route.test.ts](../../src/app/api/admin/classes/[classId]/__tests__/route.test.ts)

PATCH /api/admin/classes/[classId]; returns 401 when unauthenticated; returns 404 when the class doesn; returns 400 when suspending a non-scheduled class; returns 400 when reinstating a non-suspended class; suspends a scheduled class; reinstates a suspended class; computes suspendedUntil from durationDays when suspending; re-opens linked topic requests and notifies learners when a class is banned; fans CLASS_CANCELLED out to browse-enrolled learners when a class is banned, skipping request-linked ones; returns 400 when banning a completed class; bans a scheduled class permanently (no expiry); bans an already-suspended class; reinstates a banned class; ignores durationDays when banning.

### [route.test.ts](../../src/app/api/admin/classes/[classId]/recommendations/__tests__/route.test.ts)

POST /api/admin/classes/[classId]/recommendations; 401 when unauthenticated; 401 when the session role is not ADMIN; 404 when the class doesn; 400 on invalid body; 404 when the learner doesn; 409 when already recommended to that learner; creates the recommendation and notifies the learner; 500 when the lookup throws; GET /api/admin/classes/[classId]/recommendations; 401 when unauthenticated; lists recommendations for the class.

### [route.test.ts](../../src/app/api/admin/classes/__tests__/route.test.ts)

GET /api/admin/classes; returns 401 when unauthenticated; returns 200 with flattened topics/tutor, nextSessionAt, and pagination metadata; nextSessionAt is null when a class has no sessions; filters by subject and status when provided; matches the class code in the q search; orders by createdAt since classes no longer have a single scheduledAt.

### [route.test.ts](../../src/app/api/admin/profile/password/__tests__/route.test.ts)

POST /api/admin/profile/password; 401 when unauthenticated; 401 when the session role is not ADMIN; 400 on invalid body; 401 when the current password is wrong; updates the password hash on success; 500 when the update throws.

### [route.test.ts](../../src/app/api/admin/question-requests/[requestId]/__tests__/route.test.ts)

PATCH /api/admin/question-requests/[requestId]; 401 for a non-admin; 404 when the request does not exist; 400 when the request is not open; 400 for an invalid decision; resolves an open request, stamps the admin, and audits it; notifies the tutor with QUESTION_REQUEST_DISMISSED on a dismissal.

### [route.test.ts](../../src/app/api/admin/registrations/[userId]/__tests__/route.test.ts)

PATCH /api/admin/registrations/[userId]; 401 for a non-admin; 404 when the user does not exist; 400 when the account is not PENDING; 400 on an invalid decision; approves -> ACTIVE + USER_APPROVED audit entry; declines -> DECLINED with the reason + USER_DECLINED audit entry; 500 when the update throws.

### [route.test.ts](../../src/app/api/admin/registrations/__tests__/route.test.ts)

GET /api/admin/registrations; 401 for a non-admin; lists PENDING accounts, oldest first; applies the role and gradeLevel filters; ignores an invalid gradeLevel value; sorts by anonymous ID when ?sort=code; applies the q search filter; 500 when the query throws.

### [route.test.ts](../../src/app/api/admin/reports/__tests__/route.test.ts)

GET /api/admin/reports; returns 401 when unauthenticated; returns 401 for a non-admin role; returns flattened breakdown counts; returns 500 on unexpected error.

### [route.test.ts](../../src/app/api/admin/session-tests/__tests__/route.test.ts)

GET /api/admin/session-tests; 401 for a non-admin; flattens the session/class join into classCode/subject/sessionTopic/tutor.

### [route.test.ts](../../src/app/api/admin/settings/__tests__/route.test.ts)

GET /api/admin/settings; returns 401 when unauthenticated; returns defaults when no rows exist yet; PATCH /api/admin/settings; returns 401 when unauthenticated; returns 400 for an invalid key; returns 400 for a non-boolean value; accepts the matchingEnabled key; upserts the setting and returns the boolean value.

### [route.test.ts](../../src/app/api/admin/subjects/[id]/__tests__/route.test.ts)

/api/admin/subjects/[id]; PATCH toggles active + audits; PATCH 404 for a missing subject; DELETE 409 when the subject is in use; DELETE 200 + audits when unused.

### [route.test.ts](../../src/app/api/admin/subjects/__tests__/route.test.ts)

/api/admin/subjects; GET 401 for non-admin; POST 400 on a bad slug; POST 409 when name/slug already exists; POST 201 creates + audits, next order.

### [route.test.ts](../../src/app/api/admin/topic-requests/[id]/__tests__/route.test.ts)

PATCH /api/admin/topic-requests/[id]; 401 for a non-admin; 404 when the request doesn; 400 for an invalid status value; 400 when closing an already-terminal request; 400 when re-opening a request that isn; closes an open request, nulls fulfilledClassId, and writes an audit log entry; re-opens a cancelled request; re-opens an accepted request.

### [route.test.ts](../../src/app/api/admin/topic-requests/__tests__/route.test.ts)

GET /api/admin/topic-requests; 401 for a non-admin; filters by status, subject, and scope; filters by scope=public; returns the anonymized + real-name learner view.

### [route.test.ts](../../src/app/api/admin/topics/[id]/__tests__/route.test.ts)

/api/admin/topics/[id]; PATCH rename fans out to the denormalised columns; PATCH order-only change does not fan out; PATCH 409 on a name clash within the subject; DELETE soft-deletes (active:false) when the topic is in use; DELETE hard-deletes when the topic is unused.

### [route.test.ts](../../src/app/api/admin/users/[userId]/__tests__/route.test.ts)

PATCH /api/admin/users/[userId]; returns 401 when unauthenticated; returns 404 when the user doesn; returns 400 when targeting an admin account; returns 400 for an invalid status; updates the account status successfully; computes statusExpiresAt from durationDays when suspending; leaves statusExpiresAt null for an indefinite suspension; clears statusExpiresAt when banning.

### [route.test.ts](../../src/app/api/admin/users/__tests__/route.test.ts)

GET /api/admin/users; returns 401 when unauthenticated; returns 401 for a non-admin role; returns 200 excluding admin accounts by default; filters by role and search term when provided; filters by grade level when a valid ?gradeLevel is given; maps ?sort/?dir to orderBy, ignoring unknown sort keys; returns 500 on unexpected error.

### [route.test.ts](../../src/app/api/auth/forgot-password/__tests__/route.test.ts)

POST /api/auth/forgot-password; 400 on an invalid email; issues a hashed single-use token for a matching active account; emails the reset link (with the raw token) to the submitted address; still returns the neutral 200 when the email send fails; matches on the recovery email as well as the primary; returns the neutral message without a token when no account matches; does not issue a token for a banned account; 500 when the lookup throws.

### [route.test.ts](../../src/app/api/auth/resend-verification/__tests__/route.test.ts)

POST /api/auth/resend-verification; 400 on an invalid email; issues a hashed single-use token for an unverified account; emails the verify link (with the raw token) to the submitted address; returns the neutral message without a token when no account matches; does not issue a token for an already-verified account; does not issue a token for a banned account; 500 when the lookup throws.

### [route.test.ts](../../src/app/api/auth/reset-password/__tests__/route.test.ts)

POST /api/auth/reset-password; 400 when the new password is too short; 400 when the token does not exist; 400 when the token was already used; 400 when the token has expired; hashes the new password and burns the token on success; 500 when the update throws.

### [route.test.ts](../../src/app/api/auth/verify-email/__tests__/route.test.ts)

POST /api/auth/verify-email; 400 when the token is missing; 400 when the token does not exist; 400 when the token was already used; 400 when the token has expired; sets emailVerifiedAt and burns the token on success; 500 when the update throws.

### [route.test.ts](../../src/app/api/chatbot/__tests__/route.test.ts)

POST /api/chatbot; 401 when unauthenticated; 403 when the chatbot is disabled; 400 on an empty or oversized message; 200 with a matched intent reply and no miss logged; logs a ChatbotMiss for an unmatched message.

### [route.test.ts](../../src/app/api/classes/[classId]/enroll/__tests__/route.test.ts)

POST /api/classes/[classId]/enroll; returns 401 when unauthenticated or wrong role; returns 404 when the class does not exist; returns 400 when the class is not scheduled; returns 400 when the class is unpublished; returns 400 when the class has no upcoming sessions; returns 409 when the class is full; returns 409 when already enrolled; lazily reinstates expired class suspensions before checking eligibility; returns 201 on successful enrollment and notifies the tutor; DELETE /api/classes/[classId]/enroll; returns 401 when unauthenticated or wrong role; returns 404 when the class does not exist; returns 404 when not enrolled; returns 400 when the class is not scheduled; returns 200 on successful unenrollment and notifies the tutor.

### [route.test.ts](../../src/app/api/classes/__tests__/route.test.ts)

GET /api/classes; returns 401 when unauthenticated; returns 401 for the wrong role; browse (unfiltered) ranks in JS and slices the page — no SQL skip/take; browse personalization ranks an interest-subject / sooner class ahead of a newer one; ANDs browse filters (q / subject / gradeLevel) onto the base browse where; search by subject display name resolves to slugs in the OR filter; scope=mine defaults to the Upcoming tab (SCHEDULED + SUSPENDED); scope=mine&status=completed filters to COMPLETED and can add search filters; returns 500 on unexpected error.

### [route.test.ts](../../src/app/api/learner/classes/[classId]/session-tests/__tests__/route.test.ts)

GET /api/learner/classes/[classId]/session-tests; 401 for a non-learner; 403 when not enrolled; a DRAFT test is reported as no test at all; surfaces the learner.

### [route.test.ts](../../src/app/api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start/__tests__/route.test.ts)

POST /test/[kind]/start — the §2 ladder; 401 wrong role; 403 flag off; 404 bad kind; 404 class not found; 403 not enrolled; 403 class SUSPENDED/BANNED; 404 session not in class; 404 test is DRAFT (indistinguishable from absent); 409 CLOSED; 409 per the gating table — POST not open while the session is SCHEDULED; 409 per the gating table — PRE window closed once the session is COMPLETED; 409 per the gating table — no new starts once the session is CANCELLED; 409 already SUBMITTED; 200 resume — an in-progress attempt bypasses the gating table entirely; 201 create — a fresh PRE attempt while the session is SCHEDULED; 200 resume — a concurrent start that loses the unique-constraint race returns the winner.

### [route.test.ts](../../src/app/api/learner/match/__tests__/route.test.ts)

POST /api/learner/match; returns 401 for a non-learner; returns 403 when matching is disabled; returns 400 for an invalid topic in the subject; returns ranked matches with reasons; returns 500 on unexpected error.

### [route.test.ts](../../src/app/api/learner/profile/__tests__/route.test.ts)

PATCH /api/learner/profile; returns 401 for the wrong role; returns 400 for an empty section; returns 400 when contactInfo exceeds the max length; updates section only; clears contactInfo when passed an empty string; updates both fields at once; returns 500 on unexpected errors.

### [route.test.ts](../../src/app/api/learner/profile/password/__tests__/route.test.ts)

POST /api/learner/profile/password; 401 when unauthenticated; 401 when the session role is not STUDENT_LEARNER; 400 on invalid body; 401 when the current password is wrong; updates the password hash on success; 500 when the update throws.

### [route.test.ts](../../src/app/api/learner/progress/__tests__/route.test.ts)

GET /api/learner/progress; 401 for a non-learner; filters by classId when given; carries only classCode/subject/topic/scheduledAt — no tutor identity, no class average; skips sessions with a DRAFT (or no) test.

### [route.test.ts](../../src/app/api/learner/reports/__tests__/route.test.ts)

POST /api/learner/reports; 401 for a non-learner; 400 when no violation is selected; 400 when Other is picked without a description; 404 when the tutor does not exist; 403 when the learner has no class with that tutor; 409 when an open report about that tutor already exists; 201 and creates the report with its violation rows; notifies every active admin without leaking the reporter; reports a class the learner is enrolled in; 403 when reporting a class the learner is not enrolled in; GET /api/learner/reports; 401 for a non-learner; returns only the caller.

### [route.test.ts](../../src/app/api/learner/session-test-attempts/[attemptId]/submit/__tests__/route.test.ts)

POST /learner/session-test-attempts/[attemptId]/submit; 404 when it; 409 re-submitting an already-submitted attempt; 400 on a malformed body; 200 grades, persists, and reveals the result; notifies the tutor once a PRE attempt is submitted; does not notify anyone for a POST attempt.

### [route.test.ts](../../src/app/api/learner/topic-requests/[id]/__tests__/route.test.ts)

PATCH /api/learner/topic-requests/[id]; 404 when the request is not the caller; 400 when cancelling a request in a terminal state; cancels an ACCEPTED request and nulls fulfilledClassId (class kept); 400 for a status other than CANCELLED; cancels an open request; edits an open request; 400 when editing a request that is no longer open.

### [route.test.ts](../../src/app/api/learner/topic-requests/__tests__/route.test.ts)

GET /api/learner/topic-requests; 401 for non-learner; returns only the caller; POST /api/learner/topic-requests; 403 when matching disabled; 400 for a topic that doesn; 409 when the learner already has the maximum open requests; creates the request and returns 201; 400 when directedTutorId does not resolve to a real tutor; directedTutorId path creates the request and notifies the tutor.

### [route.test.ts](../../src/app/api/learner/tutors/__tests__/route.test.ts)

GET /api/learner/tutors; 401 for a non-learner; returns anonymized, aggregated tutor rows; legacy single ?subject= filters to a CERTIFIED cert in that subject; multi-select ?subjects= ANDs one CERTIFIED clause per subject; includes the real name only when showTutorRealNames is on.

### [route.test.ts](../../src/app/api/notifications/__tests__/route.test.ts)

GET /api/notifications; 401 when unauthenticated; returns only the caller; clamps ?take to the 1..50 range.

### [route.test.ts](../../src/app/api/notifications/read/__tests__/route.test.ts)

POST /api/notifications/read; 401 when unauthenticated; with no ids, marks all of the caller; with ids, marks only those notifications read.

### [route.test.ts](../../src/app/api/register/__tests__/route.test.ts)

POST /api/register; returns 403 when registration is closed; returns 400 for invalid input; returns 409 when the email already exists; registers a learner successfully; registers a tutor successfully via transaction; creates a PENDING learner when approval is required; issues a verification token and emails a link when verification is required; returns 500 when an unexpected error occurs.

### [route.test.ts](../../src/app/api/search/__tests__/route.test.ts)

GET /api/search; 401 when unauthenticated; returns no groups for a query shorter than 2 chars; learner: returns class, tutor and topic groups with learner hrefs; tutor: only searches their own classes, no tutor group; tutor: surfaces eligible open topic requests as a ; learner scope=classCode: only searches the class code, no tutor/topic groups; learner scope=tutorCode: only searches tutors by anonymous ID; learner scope=subject: resolves a subject name to slugs for the class query.

### [route.test.ts](../../src/app/api/tutor/assessments/[attemptId]/submit/__tests__/route.test.ts)

POST /api/tutor/assessments/[attemptId]/submit; 404 when the attempt belongs to another tutor; 409 when the attempt was already submitted; grades both-correct as 100% PASSED and, with auto-certify on, certifies the topic; PASSED with auto-certify off creates a PENDING certification carrying the score; grades all-wrong as FAILED and marks the certification REJECTED; does not touch the certification when the tutor is already CERTIFIED.

### [route.test.ts](../../src/app/api/tutor/assessments/__tests__/route.test.ts)

POST /api/tutor/assessments; 401 for a non-tutor; 404 when the tutor has no profile; 409 BANK_NOT_READY when the active bank is smaller than minBankSize; the minBankSize gate counts BANK questions only (not tutor-authored ones); 409 when the tutor is already certified for the topic; resumes an in-progress attempt instead of starting a new one; 201 creates an attempt with the picked questions when the bank is ready.

### [route.test.ts](../../src/app/api/tutor/classes/[classId]/__tests__/route.test.ts)

PATCH /api/tutor/classes/[classId]; returns 403 when the class was suspended by an admin; returns 403 when the class was banned by an admin; returns 403 when the class belongs to a different tutor (no roster/edit leak); returns 400 when reducing capacity below current enrollment count; cascades CANCELLED status to every still-SCHEDULED session in one transaction; cascades COMPLETED status to every still-SCHEDULED session in one transaction; returns 400 when removing a topic still used by a session; allows removing a topic that isn; toggles published; does not cascade to sessions for non-status updates; COMPLETED cascades linked ACCEPTED/ENROLLED topic requests to FULFILLED and notifies the learner; CANCELLED cascades linked ACCEPTED/ENROLLED topic requests back to OPEN, unlinks, and notifies; COMPLETED fans CLASS_COMPLETED out to browse-enrolled learners, skipping request-linked ones; DELETE /api/tutor/classes/[classId]; re-opens a linked ACCEPTED request before deleting the class.

### [route.test.ts](../../src/app/api/tutor/classes/[classId]/appeal/__tests__/route.test.ts)

POST /api/tutor/classes/[classId]/appeal; 401 for a non-tutor; 400 on a too-short reason; 404 when the class does not exist; 403 when the class belongs to another tutor; 400 when the class is not suspended or banned; 409 when a pending appeal already exists; 201 and creates the appeal on the happy path; notifies every active admin with a CLASS_APPEAL_NEW notification.

### [route.test.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/__tests__/route.test.ts)

PATCH /api/tutor/classes/[classId]/sessions/[sessionId]; returns 401 for the wrong role; returns 404 when the class doesn; returns 404 when the session isn; returns 403 when the tutor doesn; returns 403 when the class is banned; returns 400 for an invalid topic; returns 400 when rescheduling into the past; returns 400 for an invalid status value; returns 409 when rescheduling overlaps another session; reschedules successfully, excluding itself from the overlap check; changes status to COMPLETED without requiring an overlap check; SCHEDULED -> COMPLETED with a PUBLISHED session test notifies every enrolled learner; SCHEDULED -> COMPLETED with no test (or a DRAFT one) sends no post-test notification; changes status to CANCELLED; returns 500 on unexpected errors; DELETE /api/tutor/classes/[classId]/sessions/[sessionId]; returns 401 for the wrong role; returns 404 when the class doesn; returns 403 when the tutor doesn; returns 400 when the session isn; returns 400 when deleting the last session of a class with enrollments; allows deleting the last session when there are no enrollments; allows deleting a non-last session even with enrollments; returns 500 on unexpected errors.

### [route.test.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/__tests__/route.test.ts)

GET /test; 401 for a non-tutor; returns test: null when no test exists yet; POST /test; 409 when the session already has a test; 403 when sessionTestsEnabled is off; 201 creates the test scoped to this session; 400 for an invalid title; PATCH /test; 409 when the test is not DRAFT; saves the update when DRAFT; DELETE /test; 409 when the test has attempts; deletes a draft, unattempted test.

### [route.test.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]/__tests__/route.test.ts)

GET /test/attempts/[attemptId] (tutor); 404 when the attempt belongs to a different test; exposes only the learner.

### [route.test.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/questions/__tests__/route.test.ts)

PUT /test/questions; 409 once the test is published; 409 once the test has any attempt, even if still DRAFT; 400 on a duplicate question id; 400 when a question is not BANK-of-this-subject or TUTOR-owned; replaces the ordered question set and asks for BANK-of-subject OR owned-TUTOR questions.

### [route.test.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/results/__tests__/route.test.ts)

GET /test/results; 401 for a non-tutor; 404 when there is no test yet; 403 when the class belongs to another tutor.

### [route.test.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/status/__tests__/route.test.ts)

PATCH /test/status; 400 before publishing an empty test; publishing notifies every enrolled learner with SESSION_PRETEST_OPEN; 409 closing a test that isn; closes a published test.

### [route.test.ts](../../src/app/api/tutor/classes/[classId]/sessions/__tests__/route.test.ts)

POST /api/tutor/classes/[classId]/sessions; returns 401 for the wrong role; returns 404 when the class doesn; returns 403 when the tutor doesn; returns 403 when the class is suspended; returns 400 when the class isn; returns 400 when the topic isn; returns 400 for a past scheduledAt; returns 409 on overlap with another session; returns 201 on success; returns 500 on unexpected errors.

### [route.test.ts](../../src/app/api/tutor/classes/[classId]/test-results/__tests__/route.test.ts)

GET /api/tutor/classes/[classId]/test-results; 401 for a non-tutor; 403 when the class belongs to another tutor; 404 when the class doesn.

### [route.test.ts](../../src/app/api/tutor/classes/__tests__/route.test.ts)

GET /api/tutor/classes; returns 401 for the wrong role; returns 404 when no tutor profile exists; returns 200 with sessions included in each class; POST /api/tutor/classes; returns 401 for the wrong role; returns 404 when no tutor profile exists; returns 400 for a missing sessions array; returns 400 for an empty sessions array; accepts a custom topic that isn; returns 400 for a topic shorter than 2 characters; still blocks an uncertified custom topic when certification is required; returns 400 when a session; returns 400 when the tutor isn; returns 400 for a session scheduled in the past; returns 409 when two submitted sessions overlap each other; returns 409 when a session overlaps an existing session in another class; creates the class with its sessions on success; persists an optional target gradeLevel; defaults gradeLevel to null when omitted; creates a class with multiple non-overlapping sessions; returns 500 on unexpected errors.

### [route.test.ts](../../src/app/api/tutor/profile/__tests__/route.test.ts)

PATCH /api/tutor/profile; returns 401 for the wrong role; returns 400 for an empty section; returns 400 when contactInfo exceeds the max length; updates contactInfo only; updates section only; updates both fields at once; returns 500 on unexpected errors.

### [route.test.ts](../../src/app/api/tutor/profile/password/__tests__/route.test.ts)

POST /api/tutor/profile/password; 401 when unauthenticated; 401 when the session role is not STUDENT_TUTOR; 400 on invalid body; 401 when the current password is wrong; updates the password hash on success; 500 when the update throws.

### [route.test.ts](../../src/app/api/tutor/question-bank/__tests__/route.test.ts)

GET /api/tutor/question-bank; 401 for a non-tutor; always scopes to active BANK questions (never TUTOR-authored).

### [route.test.ts](../../src/app/api/tutor/questions/__tests__/route.test.ts)

GET /api/tutor/questions; returns only the caller; POST /api/tutor/questions; 401 for a non-tutor; 400 when the topic is not one of the class; 400 when not exactly one option is correct; 201 forces origin TUTOR + owner + class subject.

### [route.test.ts](../../src/app/api/tutor/students/__tests__/route.test.ts)

GET /api/tutor/students; returns 401 for the wrong role; returns 404 when no tutor profile exists; returns 200 with an empty roster; groups multiple enrollments for the same learner into one entry; never includes firstName, lastName, or email in the response; applies gradeLevel/section/subject/classId filters to the query; matches the q param against the learner; paginates the grouped, distinct-learner list; returns 500 on unexpected errors.

### [route.test.ts](../../src/app/api/tutor/topic-certifications/__tests__/route.test.ts)

GET /api/tutor/topic-certifications; returns 401 for the wrong role; returns 404 when no tutor profile exists; returns 200 with the tutor; attaches usedInClasses when a certification; returns an empty usedInClasses array when no class covers the certified topic; POST /api/tutor/topic-certifications; returns 401 when unauthenticated; returns 404 when no tutor profile exists; returns 400 for invalid input; returns 400 for a topic that doesn; upserts a PENDING certification request when none exists yet; re-opens a REJECTED certification as PENDING; does not downgrade a CERTIFIED certification.

### [route.test.ts](../../src/app/api/tutor/topic-requests/[id]/accept/__tests__/route.test.ts)

POST /api/tutor/topic-requests/[id]/accept; 401 for non-tutor; 400 when the request is not OPEN; 403 when the tutor is not eligible for this request (not directed, no matching cert); 400 when the submitted subject doesn; 400 when a submitted topic isn; 400 when a session is scheduled in the past; 409 on a time conflict with an existing session; happy path: creates the class, marks the request ACCEPTED, notifies the learner, does not enroll anyone.

### [route.test.ts](../../src/app/api/tutor/topic-requests/__tests__/route.test.ts)

GET /api/tutor/topic-requests; 401 for non-tutor; 403 when matching disabled; 404 when the tutor has no profile; tab=open returns anonymized requests scoped to the tutor; tab=open flags a request directed at this tutor; filters open requests by an explicit subject query param; tab=accepted scopes to requests accepted into this tutor.

### [progressTooltip.test.ts](../../src/components/charts/__tests__/progressTooltip.test.ts)

buildProgressTooltipRows; keeps series declaration order (pre before post); renders each score with the unit; shows ; treats a missing key and an empty string as not-taken; does NOT fall back to a stale value from another point; respects a custom missing label.

### [assessmentConfig.test.ts](../../src/lib/__tests__/assessmentConfig.test.ts)

getAssessmentConfig; returns the global defaults when no rows exist; uses stored values when present; falls back to a default for an unparseable or non-positive value.

### [assessmentPicker.test.ts](../../src/lib/__tests__/assessmentPicker.test.ts)

pickQuestionIds; returns exactly `count` ids when the pool is larger; prefers questions not seen in the last attempt; tops up with seen questions when the fresh pool is too small; returns the whole pool (shuffled) when it is not larger than `count`; only ever draws from the BANK pool (never tutor-authored questions).

### [auth.test.ts](../../src/lib/__tests__/auth.test.ts)

auth authorize(); throws when email or password is missing; throws a generic message when no user is found for the email; throws when the password does not match; throws when the account is suspended; auto-reactivates and allows login when a suspension has expired; still blocks login when a suspension has a future expiry; throws the ACCOUNT_PENDING sentinel when the account is awaiting approval; throws when the account is banned; throws the ACCOUNT_DECLINED sentinel (with the reason) when the registration was declined; throws a bare ACCOUNT_DECLINED sentinel when no reason was recorded; throws the ACCOUNT_UNVERIFIED sentinel when verification is required and unmet; checks verification before PENDING approval — an unverified pending account sees ACCOUNT_UNVERIFIED; still enforces ACCOUNT_PENDING once the email is verified; allows login when verification is required and already met; returns the user payload when credentials are valid; auth session config; uses jwt strategy with an 8 hour session.

### [browseRanking.test.ts](../../src/lib/__tests__/browseRanking.test.ts)

scoreBrowseClass; rewards an interest-subject match; rewards an exact grade match over none; rewards a sooner next session; gives no soonness credit for a class with no upcoming session; rankBrowseClasses; orders by score desc, then newest first as a tiebreak; is a pure function (input array not mutated).

### [classQueries.test.ts](../../src/lib/__tests__/classQueries.test.ts)

toLearnerClassDTO; exposes only the anonymised tutor ID by default (double-blind); includes the real name + section when showRealNames is true; carries the moderation scalars straight through.

### [contactInfo.test.ts](../../src/lib/__tests__/contactInfo.test.ts)

normalizeContactInfo; accepts an empty string; normalises PH mobile numbers to the local 09XXXXXXXXX form; rejects phone-like input that is not a valid PH mobile number; rejects a free-form handle — numbers only.

### [csv.test.ts](../../src/lib/__tests__/csv.test.ts)

toCsv; writes a header row from the first object; uses the explicit header order and pulls those columns; escapes commas, quotes and newlines inside a value; renders null / undefined as an empty quoted field; returns just a trailing CRLF for no rows and no headers.

### [derivedAvailability.test.ts](../../src/lib/__tests__/derivedAvailability.test.ts)

deriveWeeklyAvailability; returns an empty list when there are no sessions; turns one upcoming session into one weekday window (start + duration); ignores past, cancelled, and completed sessions; merges overlapping and back-to-back sessions on the same weekday; keeps a gap on the same weekday as two separate windows; orders windows Monday-first across weekdays; caps an over-running window at end of day.

### [gradeAttempt.test.ts](../../src/lib/__tests__/gradeAttempt.test.ts)

gradeAttempt; marks a chosen correct option as correct; treats an unanswered question as wrong; treats an option id not belonging to the question as wrong; rounds the percentage and uses `total` as the denominator (missing answers drag it down); returns 0% for a zero-question total instead of dividing by zero.

### [idGenerator.test.ts](../../src/lib/__tests__/idGenerator.test.ts)

generateAnonymousId; formats a zero-padded tutor ID; formats a zero-padded learner ID; generateClassCode; upserts the CLASS counter and formats C-000N; keeps four-digit padding past 1000.

### [mail.test.ts](../../src/lib/__tests__/mail.test.ts)

isMailConfigured; is false when SMTP_HOST / MAIL_FROM are unset; is true once SMTP_HOST and MAIL_FROM are set; sendMail; no-ops (no transport call) when unconfigured; sends via the transport with the configured From when configured; reuses a single transporter across calls; propagates a transport failure to the caller; renderPasswordResetEmail; puts the reset URL in both bodies and states the 30-minute expiry.

### [matching.test.ts](../../src/lib/__tests__/matching.test.ts)

scoreClass — hard filters; excludes a different subject; excludes when no requested topic overlaps; excludes a full class; excludes an unpublished or non-scheduled class; excludes a class with no upcoming scheduled session; classFormat SOLO keeps only 1-on-1 classes; classFormat GROUP keeps only multi-seat classes; classFormat ANY / undefined does not filter by capacity; scoreClass — scoring; scores more matched topics higher; adds a bonus for a verified matched topic; credits sessions that fall inside a preferred slot; ranks grade fit exact > adjacent > any > mismatch; rankMatches; returns matches best-first and drops non-matches; returns results ordered by score, highest first; prefers the class whose next session is sooner.

### [moderation.test.ts](../../src/lib/__tests__/moderation.test.ts)

computeExpiresAt; returns null when no duration is given; returns null when duration is zero; computes a date offset by the given number of days.

### [rateLimit.test.ts](../../src/lib/__tests__/rateLimit.test.ts)

rateLimit(); allows exactly `limit` hits per window, then blocks; resets after the window elapses; keys are independent; clientIp(); reads the first x-forwarded-for entry from a Headers object; reads x-forwarded-for from a plain header bag; falls back to x-real-ip, then .

### [sessionTestAccess.test.ts](../../src/lib/__tests__/sessionTestAccess.test.ts)

loadOwnedClass; 404 when the tutor has no profile; 403 when the class belongs to another tutor; 403 when the class is SUSPENDED or BANNED; returns the tutor profile + class on success; loadOwnedSession; 404 when the session doesn; returns a null test when none exists yet; loadEnrolledSession; 403 when the learner is not enrolled; 403 when the class is under moderation, even if enrolled; 404 when the session isn; succeeds for an enrolled learner in an active class.

### [sessionTestResults.test.ts](../../src/lib/__tests__/sessionTestResults.test.ts)

buildSessionTestResults; returns null when the test doesn; avgDelta is the mean of PAIRED per-learner deltas, not avgPost - avgPre, when some learners are unpaired; computes per-question correct rate + deltaRate from the same `position`; buildClassSessionTestRollup; returns null when the class doesn; a session with no test is a gap (nulls), not a fake zero; aggregates avgDelta across sessions as the mean of every paired learner.

### [sessionTestSerialize.test.ts](../../src/lib/__tests__/sessionTestSerialize.test.ts)

serializeSessionTestAttempt; takes `kind` from the attempt, not the test; strips correct-answer info, explanations, grades and score when reveal is false; includes everything when reveal is true; serializeSessionTest; has no `kind` field — one set served twice.

### [subjectTopics.test.ts](../../src/lib/__tests__/subjectTopics.test.ts)

normalizeTopic; trims and collapses internal whitespace; leaves an already-clean string unchanged; isKnownTopic; matches a curated topic case-insensitively; returns false for a custom topic; returns false for a topic from a different subject.

### [subjects.test.ts](../../src/lib/__tests__/subjects.test.ts)

lib/subjects; caches the DB read across calls; filters inactive subjects and topics by default; topicExists is case-insensitive and honours active; subjectExists + getSubjectSlugs.

### [classifier.test.ts](../../src/lib/chatbot/__tests__/classifier.test.ts)

classify — intent matching; resolves a Taglish phrasing the same as its English form; returns nothing for an unintelligible message (-> fallback); classify — role gating; does not match a tutor-only intent for a learner; does not match an admin-only intent for a tutor; only offers the recommendation intent to learners; does not serve a tutor-workflow FAQ to a learner; does not serve a learner-workflow FAQ to a tutor or admin; still serves platform-wide FAQs to every role; classify — FAQ retrieval; classify — typo tolerance (v1.1); resolves a single-edit-distance misspelling to the intended intent; resolves a misspelling to the intended FAQ entry; does not fuzzy-match short words; classify — narrowed smalltalk_capabilities (v1.1); a bare ; a genuine ; classify — length-normalized confidence (v1.1); rejects a long rambling message that only glances a couple of keywords; still accepts a short, pointed query.

### [faq.test.ts](../../src/lib/chatbot/__tests__/faq.test.ts)

FAQ_ENTRIES — catalogue integrity; has unique, faq_-prefixed ids; every entry has a non-empty question, answer, and at least 3 keywords; has no keyword that tokenize() would drop as a stopword; FAQ_ENTRIES — retrieval round-trip; role-scoped entries are not served to the wrong role.

### [misses.test.ts](../../src/lib/chatbot/__tests__/misses.test.ts)

aggregateMisses; groups messages that normalise to the same token string, case/punctuation-insensitive; keeps groups separate per role even with identical wording; tracks firstSeen / lastSeen and uses the most recent phrasing as the sample; filters by role and by a case-insensitive text search; sorts by count and by lastSeen; falls back to lastSeen for an unrecognised sort key; paginates the grouped results.

### [normalize.test.ts](../../src/lib/chatbot/__tests__/normalize.test.ts)

editDistance; computes the classic Levenshtein distance; handles empty strings; fuzzyHit; matches exact tokens; matches a single-edit typo of a keyword at least 4 chars long; does not match short words fuzzily; does not match words more than one edit apart; tokenize; drops stopwords, including ones used as dead keywords previously; folds Taglish synonyms to their canonical token; catalogue keyword hygiene; no chatbot keyword list should contain a word tokenize() would drop.

### [recommend.test.ts](../../src/lib/chatbot/__tests__/recommend.test.ts)

extractCriteria; detects the subject from keywords; detects a named topic within the subject; recommendClasses; ranks matching classes when a topic is named; falls back to open classes when no topic is named; flags fallbackToRequest when nothing is available; returns nothing when no subject could be extracted.

### [auth.test.ts](../../src/lib/validations/__tests__/auth.test.ts)

registerSchema; accepts a valid learner registration; accepts a valid tutor registration; lowercases and trims email; rejects an invalid email; rejects a password shorter than 8 characters; rejects a common password; rejects a password longer than 72 bytes (bcrypt truncation); rejects a missing first name; rejects an invalid grade level; requires consentGiven to be true; rejects when consentGiven is missing; allows empty contactInfo; rejects an unknown registration type.

### [class.test.ts](../../src/lib/validations/__tests__/class.test.ts)

sessionSchema; accepts a valid session; rejects an empty topic; rejects a non-ISO scheduledAt; rejects duration below 15 minutes; rejects duration above 240 minutes; classDetailsSchema; accepts valid class details; rejects an empty topics array; rejects more than 10 topics; rejects maxStudents below 1; rejects maxStudents above 10; createClassSchema; accepts class details plus at least one session; rejects zero sessions; rejects more than 20 sessions; rejects when neither a location nor a meeting link is given; accepts a building/room location instead of a meeting link; addSessionSchema; is the same shape as sessionSchema; updateSessionSchema; accepts a partial update with just a status; accepts an empty object (no-op update); rejects an invalid status value; still enforces duration bounds when duration is provided.

### [report.test.ts](../../src/lib/validations/__tests__/report.test.ts)

createReportSchema; accepts a checklist-only report; rejects a report with no violations; requires a 10+ char description when OTHER is chosen; rejects an unknown violation value; reviewReportSchema; accepts RESOLVE and DISMISS; rejects anything else.

Total tracked files accounted for: **741**.
