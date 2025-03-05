FROM python:3.9.21-alpine3.21

WORKDIR /api

COPY pyproject.toml /api/pyproject.toml

COPY ./app /api/app

RUN pip install --no-cache-dir poetry 
RUN poetry install

CMD ["poetry", "run", "start"]