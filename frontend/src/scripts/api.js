export async function getUser(id) {
    const response = await fetch(`/api/get_user/${id}`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.user;
}