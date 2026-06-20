from datetime import UTC, datetime

from schemas.raw_job import RawJob
from transformations.normalization import (
    classify_role,
    classify_seniority,
    classify_seniority_details,
    clean_description,
    extract_technologies,
    normalize_job,
    normalize_salary,
)


def raw_job(**overrides: object) -> RawJob:
    values = {
        "source_name": "remotive",
        "external_id": "1",
        "source_url": "https://example.com/1",
        "title": "Senior Backend Engineer",
        "company_name": "Acme",
        "description_raw": "<p>Build Python and PostgreSQL APIs.</p>",
        "fetched_at": datetime.now(UTC),
        "raw_payload": {},
        "tags": ["Software Development"],
    }
    values.update(overrides)
    return RawJob(**values)


def test_clean_description_removes_html_and_scripts() -> None:
    value = "<p>Hello &amp; welcome</p><script>bad()</script><ul><li>Python</li></ul>"
    assert clean_description(value) == "Hello & welcome Python"


def test_extract_technologies_uses_boundaries_and_aliases() -> None:
    found = extract_technologies("Node.js Engineer", "React, TS and PostgreSQL", ["AWS"])
    assert found == ["React", "Node.js", "PostgreSQL", "AWS"]


def test_classification_primarily_uses_title() -> None:
    assert classify_role("Senior Data Engineer", "React landing pages") == "data"
    assert classify_seniority("Principal Platform Engineer") == "senior"
    assert classify_seniority("Junior Java Developer") == "junior"
    assert classify_seniority("Solutions Architect") is None
    assert classify_seniority("Senior Solutions Architect") == "senior"
    assert classify_seniority("Lead Platform Engineer") == "lead"
    assert classify_seniority("Head of Engineering") == "manager"
    assert classify_role("Senior Solutions Architect") == "software"
    assert classify_role("Director, Field Engineering") == "management"
    assert classify_role("Research Scientist, Interpretability") == "machine_learning"


def test_classification_recognizes_mid_level_titles() -> None:
    assert classify_seniority("Intermediate Backend Engineer") == "mid"
    assert classify_seniority("Software Engineer (Mid Level)") == "mid"
    assert classify_seniority("Semi-Senior Python Developer") == "mid"


def test_classification_uses_quantified_experience_without_title_level() -> None:
    junior = classify_seniority_details(
        "Software Engineer", "Candidates need 2+ years of professional experience."
    )
    mid = classify_seniority_details(
        "Backend Engineer", "At least 3 years of relevant experience are required."
    )
    senior = classify_seniority_details(
        "Platform Engineer", "You have 5+ years of software engineering experience."
    )

    assert (junior.level, junior.source, junior.experience_min_years) == (
        "junior",
        "description",
        2,
    )
    assert mid.level == "mid"
    assert senior.level == "senior"


def test_title_wins_and_ambiguous_experience_stays_unclassified() -> None:
    titled = classify_seniority_details(
        "Junior Developer", "Requires 5+ years of professional experience."
    )
    ambiguous = classify_seniority_details(
        "Software Developer", "Requires 2-5 years of professional experience."
    )
    generic = classify_seniority_details(
        "Software Developer", "Previous professional experience is required."
    )

    assert (titled.level, titled.source, titled.confidence) == ("junior", "title", 1.0)
    assert ambiguous.level is None
    assert ambiguous.confidence == 0.4
    assert generic.level is None
    assert generic.source is None


def test_non_technology_job_is_rejected() -> None:
    job = raw_job(
        title="Customer Success Manager",
        description_raw="Manage relationships and renewals.",
        tags=["Customer Service"],
    )
    assert normalize_job(job) is None

    assistant = raw_job(
        title="Executive Assistant",
        description_raw="Support leaders in a Python engineering organization.",
        tags=["Engineering"],
    )
    assert normalize_job(assistant) is None


def test_salary_uses_only_explicit_field() -> None:
    assert normalize_salary("€55,000 - €70,000 per year") == (55000, 70000, "EUR", "year")
    normalized = normalize_job(
        raw_job(description_raw="Python role founded in 2012 with 500 employees", salary_raw=None)
    )
    assert normalized is not None
    assert normalized.salary_min is None
    assert normalized.salary_max is None
