# ─── Build stage ────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /build

# Cache dependencies first (layer caching)
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Build the application
COPY src ./src
RUN mvn clean package -DskipTests -q

# Flatten the runtime classpath (compiled classes + resolved third-party jars) so the
# run stage can start the app with a plain `java -cp`, appending whichever jars happen
# to sit under /app/customs. Customizations (see the separate Customs repository) are
# built entirely on their own and dropped in — or bind-mounted in — at deploy time;
# this image never needs to be rebuilt to add, remove or swap one.
RUN mvn -q dependency:copy-dependencies \
      -DoutputDirectory=/build/target/dependency \
      -DincludeScope=runtime \
      -DexcludeGroupIds=org.projectlombok

# ─── Run stage ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Create non-root user for security
RUN groupadd --system formcraft && useradd --system --gid formcraft formcraft

# Base application ("addons"): compiled classes + third-party dependency jars.
COPY --from=builder /build/target/classes ./classes
COPY --from=builder /build/target/dependency ./lib

# Plug-in point for client customizations, built independently (see the Customs
# repository). Empty by default — bind-mount a folder of customization jars over
# /app/customs at `docker run`/compose time (see docker-compose.yml) to activate
# them. Nothing here changes to add, remove or swap a customization.
RUN mkdir -p /app/customs && chown -R formcraft:formcraft /app

USER formcraft

EXPOSE 8080

ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.profiles.active=docker", \
  "-cp", "/app/classes:/app/lib/*:/app/customs/*", \
  "fr.formcraft.FormCraftApplication"]
