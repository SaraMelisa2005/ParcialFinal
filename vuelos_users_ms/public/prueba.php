<?php

$var = password_hash('admin123', PASSWORD_BCRYPT);
echo "La contraseña admin123 cifrada es: ".$var;
if (var_dump(password_verify('admin123', '$2y$10$Pss4XIm7R.F3Vd1kTBEs6.wjvv58B5eCsTAqQGW//OilM1e2WAZEu')))
    echo "la contraseñas coinciden";
else
    echo "la contraseñas no coinciden";

?>