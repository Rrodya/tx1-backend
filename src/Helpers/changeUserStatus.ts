import User from "../Models/User";

export default async function changeUserStatus(id: string, status: number) {
  console.log(status);
  await User.updateOne({_id: id}, {status: status})
  const user = await User.findById({_id: id});
  return user;
}