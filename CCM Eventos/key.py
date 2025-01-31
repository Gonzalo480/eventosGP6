import secrets

# Genera una clave segura de 32 bytes codificada en hex
secret_key = secrets.token_hex(32)
print("Tu SECRET_KEY es:", secret_key)