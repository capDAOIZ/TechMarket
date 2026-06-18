from abc import ABC, abstractmethod
from typing import Any


class JobReadRepository(ABC):
    @abstractmethod
    def list_jobs(self, **filters: Any) -> tuple[list[Any], int]: ...

    @abstractmethod
    def get_job(self, job_id: int) -> Any | None: ...
