import hashlib
import html
import re
import unicodedata
from html.parser import HTMLParser

from schemas.raw_job import RawJob
from src.domain.entities import NormalizedJob

TECHNOLOGY_ALIASES: dict[str, tuple[str, ...]] = {
    "Python": ("python",),
    "JavaScript": ("javascript", "js"),
    "TypeScript": ("typescript",),
    "React": ("react", "react.js", "reactjs"),
    "Node.js": ("node.js", "nodejs", "node js"),
    "Java": ("java",),
    "Spring": ("spring boot", "spring framework", "spring"),
    "FastAPI": ("fastapi",),
    "Django": ("django",),
    "PostgreSQL": ("postgresql", "postgres"),
    "MySQL": ("mysql",),
    "AWS": ("aws", "amazon web services"),
    "Azure": ("azure",),
    "GCP": ("gcp", "google cloud"),
    "Docker": ("docker",),
    "Kubernetes": ("kubernetes", "k8s"),
    "Kafka": ("kafka",),
    "Spark": ("apache spark", "pyspark", "spark"),
    "Airflow": ("airflow",),
    "Terraform": ("terraform",),
}


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self.ignored_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style"}:
            self.ignored_depth += 1
        elif tag in {"p", "br", "li", "div", "h1", "h2", "h3"}:
            self.parts.append(" ")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"} and self.ignored_depth:
            self.ignored_depth -= 1
        elif tag in {"p", "li", "div"}:
            self.parts.append(" ")

    def handle_data(self, data: str) -> None:
        if not self.ignored_depth:
            self.parts.append(data)


def clean_description(value: str | None) -> str | None:
    if not value:
        return None
    parser = _TextExtractor()
    parser.feed(html.unescape(value))
    cleaned = re.sub(r"\s+", " ", "".join(parser.parts)).strip()
    return cleaned or None


def normalize_location(value: str | None) -> tuple[str | None, str | None]:
    if not value:
        return None, None
    cleaned = re.sub(r"\s+", " ", value).strip()
    lower = cleaned.lower()
    if lower in {"remote", "worldwide", "anywhere", "global"}:
        return "Remote", None
    country_map = {
        "spain": "ES",
        "españa": "ES",
        "united states": "US",
        "usa": "US",
        "united kingdom": "GB",
        "uk": "GB",
        "germany": "DE",
        "france": "FR",
        "canada": "CA",
        "portugal": "PT",
    }
    country_code = next((code for name, code in country_map.items() if name in lower), None)
    if "remote" in lower:
        return cleaned, country_code
    return cleaned, country_code


def normalize_modality(
    title: str, location_raw: str | None, description: str | None, remote_hint: bool | None
) -> tuple[str | None, bool | None]:
    text = " ".join(part for part in (title, location_raw, description) if part).lower()
    if "hybrid" in text:
        return "hybrid", True
    if remote_hint is True or re.search(r"\b(remote|work from home|distributed)\b", text):
        return "remote", True
    if remote_hint is False:
        return "onsite", False
    if re.search(r"\b(on[ -]?site|in office)\b", text):
        return "onsite", False
    return None, None


def normalize_salary(value: str | None) -> tuple[int | None, int | None, str | None, str | None]:
    """Parse only an explicit source salary field; never inspect the job description."""
    if not value:
        return None, None, None, None
    text = value.strip().lower().replace(",", "")
    currency = None
    if "$" in text or re.search(r"\b(?:usd|us dollars?)\b", text):
        currency = "USD"
    elif "€" in text or re.search(r"\beur\b", text):
        currency = "EUR"
    elif "£" in text or re.search(r"\bgbp\b", text):
        currency = "GBP"
    period = None
    if re.search(r"(?:/|per\s+)(?:hour|hr)|hourly", text):
        period = "hour"
    elif re.search(r"(?:/|per\s+)month|monthly", text):
        period = "month"
    elif re.search(r"(?:/|per\s+)(?:year|yr)|annual|annually|yearly", text):
        period = "year"
    numbers: list[int] = []
    for number, suffix in re.findall(r"(?<!\w)(\d+(?:\.\d+)?)\s*(k)?", text):
        parsed = float(number) * (1000 if suffix else 1)
        if parsed >= 10:
            numbers.append(round(parsed))
    if not numbers:
        return None, None, currency, period
    low, high = numbers[0], numbers[1] if len(numbers) > 1 else numbers[0]
    return min(low, high), max(low, high), currency, period


def extract_technologies(title: str, description: str | None, tags: list[str]) -> list[str]:
    text = " ".join([title, description or "", *tags]).lower()
    found = []
    for canonical, aliases in TECHNOLOGY_ALIASES.items():
        if any(
            re.search(
                rf"(?<![\w{'.' if alias == 'js' else ''}]){re.escape(alias)}(?![\w])",
                text,
            )
            for alias in aliases
        ):
            found.append(canonical)
    return found


def classify_seniority(title: str) -> str | None:
    value = title.lower()
    patterns = (
        ("intern", r"\b(intern|internship|trainee)\b"),
        ("junior", r"\b(junior|jr\.?|entry[ -]level|graduate)\b"),
        ("lead", r"\b(lead|principal|staff|architect|head)\b"),
        ("senior", r"\b(senior|sr\.?)\b"),
        ("manager", r"\b(manager|director|vp|vice president)\b"),
    )
    return next((label for label, pattern in patterns if re.search(pattern, value)), None)


def classify_role(title: str, description: str | None = None) -> str | None:
    title_lower = title.lower()
    patterns = (
        (
            "management",
            r"\b(engineering manager|director of engineering|head of engineering|cto|"
            r"(?:manager|director|head)[,\s-]+[^\n]*engineering)\b",
        ),
        ("machine_learning", r"\b(machine learning|ml engineer|ai engineer|data scientist)\b"),
        ("machine_learning", r"\b(research scientist|research engineer)\b"),
        ("data", r"\b(data engineer|analytics engineer|bi engineer|etl developer)\b"),
        ("devops", r"\b(devops|platform|site reliability|sre|cloud engineer)\b"),
        ("security", r"\b(security|cybersecurity|application security)\b"),
        ("mobile", r"\b(android|ios|mobile|flutter|react native)\b"),
        ("qa", r"\b(qa|quality assurance|test automation|sdet)\b"),
        ("fullstack", r"\b(full[ -]?stack)\b"),
        ("frontend", r"\b(front[ -]?end|frontend|ui engineer)\b"),
        ("backend", r"\b(back[ -]?end|backend|api engineer|server engineer)\b"),
        ("software", r"\b(solutions? architect|technical architect|field engineering)\b"),
    )
    for role, pattern in patterns:
        if re.search(pattern, title_lower):
            return role
    if re.search(r"\b(software|developer|engineer|programmer)\b", title_lower):
        fallback = (description or "").lower()
        if re.search(r"\b(react|javascript|typescript|css|frontend)\b", fallback):
            return "frontend"
        if re.search(r"\b(api|database|python|java|backend)\b", fallback):
            return "backend"
        return "software"
    return None


def is_technology_job(
    title: str, role: str | None, technologies: list[str], tags: list[str]
) -> bool:
    title_lower = title.lower()
    excluded = (
        r"\b(sales|customer success|account executive|recruiter|recruiting|marketing|finance|"
        r"legal|executive assistant|administrative assistant|people partner|talent acquisition)\b"
    )
    if re.search(excluded, title_lower):
        return False
    if role is not None:
        return True
    tech_tags = " ".join(tags).lower()
    return bool(
        technologies and re.search(r"\b(engineering|developer|software|data|it)\b", tech_tags)
    )


def calculate_quality_score(job: RawJob, description: str | None, technologies: list[str]) -> float:
    checks = (
        (bool(job.title), 0.15),
        (bool(job.company_name), 0.15),
        (bool(job.source_url), 0.15),
        (bool(description and len(description) >= 20), 0.20),
        (job.published_at is not None, 0.10),
        (bool(job.location_raw), 0.10),
        (bool(technologies), 0.15),
    )
    return round(sum(weight for present, weight in checks if present), 2)


def detect_duplicate_group(title: str, company: str, location: str | None) -> str:
    def normalize(value: str) -> str:
        ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
        return re.sub(r"[^a-z0-9]+", " ", ascii_value.lower()).strip()

    key = "|".join((normalize(title), normalize(company), normalize(location or "")))
    return hashlib.sha256(key.encode()).hexdigest()[:24]


def normalize_job(raw: RawJob, raw_path: str | None = None) -> NormalizedJob | None:
    description = clean_description(raw.description_raw)
    technologies = extract_technologies(raw.title, description, raw.tags)
    role = classify_role(raw.title, description)
    if not is_technology_job(raw.title, role, technologies, raw.tags):
        return None
    location_name, country_code = normalize_location(raw.location_raw)
    modality, remote = normalize_modality(raw.title, raw.location_raw, description, raw.remote_hint)
    salary_min, salary_max, salary_currency, salary_period = normalize_salary(raw.salary_raw)
    return NormalizedJob(
        source_name=raw.source_name,
        external_id=raw.external_id,
        source_url=raw.source_url,
        title=raw.title.strip(),
        company_name=raw.company_name.strip(),
        location_raw=raw.location_raw,
        location_name=location_name,
        country_code=country_code,
        description=description,
        published_at=raw.published_at,
        fetched_at=raw.fetched_at,
        remote=remote,
        modality=modality,
        salary_min=salary_min,
        salary_max=salary_max,
        salary_currency=salary_currency,
        salary_period=salary_period,
        role=role,
        seniority=classify_seniority(raw.title),
        technologies=technologies,
        quality_score=calculate_quality_score(raw, description, technologies),
        duplicate_group_id=detect_duplicate_group(raw.title, raw.company_name, location_name),
        raw_path=raw_path,
    )
