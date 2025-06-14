const { ObjectId } = require("mongodb");
class ContactService {
  constructor(client) {
    this.Contact = client.db().collection("contacts");
  }
  // Định nghĩa các phương thức truy xuất CSDL sử dụng mongodb API
  extractConactData(payload) {
    const contact = {
      name: payload.name,
      email: payload.email,
      address: payload.address,
      phone: payload.phone,
      favorite: payload.favorite,
    };
    // Remove undefined fields
    Object.keys(contact).forEach(
      (key) => contact[key] === undefined && delete contact[key]
    );
    return contact;
  }
  async create(payload) {
    const contact = this.extractConactData(payload);
    const result = await this.Contact.findOneAndUpdate(
      contact,
      { $set: { favorite: contact.favorite === true } },
      { returnDocument: "after", upsert: true }
    );
    return result;
  }

  async find(filter) {
    const cursor = await this.Contact.find(filter);
    return await cursor.toArray();
  }
  async findByName(name) {
    return await this.find({
      name: { $regex: new RegExp(new RegExp(name)), $options: "i" },
    });
  }
  //   find by id
  async findById(id) {
    return await this.Contact.findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
  }
  //   update
  // async update(id, payload) {
  //   const filter = {
  //     _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
  //   };
  //   const update = this.extractConactData(payload);
  //   const result = await this.Contact.findOneAndUpdate(
  //     filter,
  //     { $set: update },
  //     { returnDocument: "after" }
  //   );
  //   return result.value;
  // }

  async update(id, payload) {
    // 1. Validate ID mạnh mẽ hơn
    if (!id || !ObjectId.isValid(id)) {
      throw new Error("Invalid contact ID format");
    }

    // 2. Kiểm tra dữ liệu update
    const updateData = this.extractConactData(payload);
    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields to update");
    }

    // 3. Thêm timeout cho cả 2 môi trường
    const options = {
      returnDocument: "after",
      maxTimeMS: 10000, // 10 seconds timeout
    };

    try {
      const result = await this.Contact.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        options
      );

      if (!result) {
        throw new Error("Contact not found");
      }
      return result;
    } catch (error) {
      // Xử lý lỗi đặc thù của Atlas
      if (error.message.includes("DNS")) {
        throw new Error("Atlas connection error");
      }
      throw error;
    }
  }
  //   Delete theo id
  async delete(id) {
    const result = await this.Contact.findOneAndDelete({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
    return result;
  }

  //   deleted all
  async deleteAll() {
    const result = await this.Contact.deleteMany({});
    return result.deletedCount;
  }

  //   Favorite
  async findFavorite() {
    return await this.find({ favorite: true });
  }
}
module.exports = ContactService;
