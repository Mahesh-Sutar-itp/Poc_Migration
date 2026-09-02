# ─── Build stage ────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /build

# Cache dependencies first (layer caching)
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Build the application
COPY src ./src
RUN mvn clean package -DskipTests -q

# ─── Run stage ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Create non-root user for security
RUN groupadd --system formcraft && useradd --system --gid formcraft formcraft

# Copy the built JAR
COPY --from=builder /build/target/formcraft-plm-1.0.0.jar app.jar

# Change ownership
RUN chown formcraft:formcraft app.jar

USER formcraft

EXPOSE 8080

ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.profiles.active=docker", \
  "-jar", "app.jar"]
