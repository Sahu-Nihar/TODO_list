const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({

  extended: true
}));

app.use(express.static("public"));

// ! Establishing connection with the mongo db
mongoose.connect("mongodb+srv://admin-nihar:Test123@cluster0.tz9o0.mongodb.net/todo_listDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// ! Creating Schema for the db using mongoose
const items_Schema = {

  name: {
    type: String,
    required: true
  }
};

// ! Creating model using the schema for the database.
const Item = mongoose.model("Item", items_Schema);

// ! populating the database:
const item_1 = new Item({

  name: "Welcome to your todo list!"
});

const item_2 = new Item({

  name: "Hit the + button to add a new item."
});

const item_3 = new Item({

  name: "<-- Hit this to delete an item."
});

const default_Items = [item_1, item_2, item_3];

// ! Creating another schema for db
const list_Schema = {

  name: {
    type: String,
    required: true
  },
  items: [items_Schema]
}

// ! New schema and collection for db
const List = mongoose.model("List", list_Schema);


// ! Default route: "/"
app.get("/", function (req, res) {

  Item.find({}, (err, found_items) => {

    if (found_items.length === 0) {

      // ! Inserting default data into the db 
      Item.insertMany(default_Items, (err) => {

        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items into the database!");
        }
      });

      res.redirect("/")

    } else {

      res.render("list", {
        list_title: "Today",
        list_of_items: found_items
      });
    }
  });

});

// ! To add new items to any list
app.post("/", function (req, res) {

  const item_name = req.body.new_item;
  const list_name = req.body.button_value;

  const item = new Item({
    name: item_name
  });

  if (list_name === "Today") {

    item.save();
    res.redirect("/");

  } else {

    List.findOne({
      name: list_name
    }, (err, found_list) => {

      found_list.items.push(item);
      found_list.save();
      res.redirect(`/${list_name}`);
    });
  }

});


// ! Dynamic route for new todo list:
app.get("/:custom_list_name", (req, res) => {

  const custom_list_name = _.capitalize(req.params.custom_list_name);

  List.findOne({
    name: custom_list_name
  }, (err, found_list) => {

    if (!err) {
      if (!found_list) {

        // * Create a new list
        const list = new List({

          name: custom_list_name,
          items: default_Items
        });
        list.save();
        res.redirect(`/${custom_list_name}`);

      } else {

        // * Show the existing list
        res.render("list", {
          list_title: found_list.name,
          list_of_items: found_list.items
        });
      }
    }

  });

});

// ! To delete an item from any list
app.post("/delete", (req, res) => {

  const checked_item_id = req.body.checkbox;
  const list_name = req.body.list_name;

  if (list_name === "Today") {

    Item.findByIdAndRemove(checked_item_id, (err) => {

      if (!err) {
        console.log("Successfully deleted checked item!");
        res.redirect("/");
      }
    });

  } else {

    List.findOneAndUpdate({
      name: list_name
    }, {
      $pull: {
        items: {
          _id: checked_item_id
        }
      }
    }, (err, found_list) => {

      if (!err) {
        res.redirect(`/${list_name}`);
      }
    });
  }
});


app.get("/about", function (req, res) {

  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {

  console.log("Server has started successfully!");
});