from datetime import UTC, datetime, timedelta

from schemas.raw_job import RawJob

from connectors.base import BaseJobConnector


class SeedConnector(BaseJobConnector):
    source_name = "seed"

    def fetch(self, limit: int | None = None) -> list[RawJob]:
        now = datetime.now(UTC).replace(microsecond=0)
        rows = [
            (
                "arbeitnow",
                "seed-a1",
                "Backend Python Engineer",
                "Acme Cloud",
                "Madrid, Spain",
                "Build APIs with Python, FastAPI, PostgreSQL, Docker and AWS.",
                False,
                "€55,000 - €70,000 per year",
                ["Python", "Backend"],
            ),
            (
                "remotive",
                "seed-r1",
                "Senior React Developer",
                "Remote Labs",
                "Worldwide",
                "Own our React and TypeScript frontend deployed on Azure.",
                True,
                "$90k-$120k/year",
                ["React", "JavaScript"],
            ),
            (
                "greenhouse",
                "stripe:seed-g1",
                "Data Engineer",
                "Stripe",
                "Remote - Europe",
                "Data pipelines using Python, Spark, Airflow, Kafka and GCP.",
                True,
                None,
                ["Data"],
            ),
            (
                "greenhouse",
                "databricks:seed-g2",
                "Staff Platform Engineer",
                "Databricks",
                "San Francisco, CA",
                "Run Kubernetes and Terraform infrastructure on AWS.",
                False,
                "$180000 - $240000 yearly",
                ["Engineering"],
            ),
            (
                "greenhouse",
                "anthropic:seed-g3",
                "Machine Learning Engineer",
                "Anthropic",
                "London, UK",
                "Production Python services, Kubernetes and PostgreSQL for ML systems.",
                False,
                "£120,000–£160,000",
                ["Machine Learning"],
            ),
            (
                "greenhouse",
                "gitlab:seed-g4",
                "Junior Java Developer",
                "GitLab",
                "Remote",
                "Develop Java and Spring services with MySQL and Docker.",
                True,
                None,
                ["Engineering"],
            ),
            (
                "greenhouse",
                "figma:seed-g5",
                "Engineering Manager",
                "Figma",
                "New York, NY",
                "Lead a team building TypeScript and Node.js systems.",
                False,
                "$190k-$230k",
                ["Engineering"],
            ),
            (
                "remotive",
                "seed-r2",
                "Customer Success Manager",
                "Sales Co",
                "Worldwide",
                "Manage enterprise customer relationships and renewals.",
                True,
                "$75,000",
                ["Customer Service"],
            ),
        ]
        jobs = []
        for index, row in enumerate(rows):
            source, external_id, title, company, location, description, remote, salary, tags = row
            jobs.append(
                RawJob(
                    source_name=source,
                    external_id=external_id,
                    source_url=f"https://example.com/{external_id}",
                    title=title,
                    company_name=company,
                    location_raw=location,
                    description_raw=f"<p>{description}</p>",
                    published_at=now - timedelta(days=index),
                    fetched_at=now,
                    raw_payload={"seed": True, "id": external_id, "title": title},
                    remote_hint=remote,
                    salary_raw=salary,
                    tags=tags,
                )
            )
        return jobs if limit is None else jobs[:limit]
