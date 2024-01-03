import { Router } from "express";

const router = Router();

router.post("/signup", (req, res) => {
  const { email, ph_no, name, password } = req.body;
  console.log(email, ph_no, name, password);
});

export default router;
