import Drive from "../Models/Drive";

export default async function changeDriveStatus(id: string, status: number) {
  console.log(status);
  await Drive.updateOne({_id: id}, {status: status})
  const drive = await Drive.findById({_id: id});
  return drive;
}