<?php
use App\Models\User;

$app->post('/login', function ($request, $response) {
    $data = $request->getParsedBody();

    $email = $data['email'] ?? null;
    $password = $data['password'] ?? null;

    $user = User::where('email', $email)->first();

    if (!$user || !password_verify($password, $user->password)) {
        return $response->withStatus(401)->withJson(['error' => 'Credenciales incorrectas']);
    }

    
    $token = base64_encode(random_bytes(24));

    return $response->withJson([
        'token' => $token,
        'user' => [
            'name' => $user->name,
            'role' => $user->role
        ]
    ]);
});