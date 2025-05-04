FROM python:3.9.21-alpine3.21

WORKDIR /api

COPY pyproject.toml /api/pyproject.toml

COPY direct-tribute-458308-s8-df943b61d55c.json /api/gcp_credentials.json

COPY ./app /api/app

RUN pip install poetry
RUN poetry install


CMD ["poetry", "run", "start"]